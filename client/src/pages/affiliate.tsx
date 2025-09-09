import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy, Users, DollarSign, Gift, Share2, TrendingUp, ArrowLeft, Home, Send, CheckCircle, Clock, XCircle } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface Account {
  id: number;
  wallet: string;
  active: boolean;
  referralCode: string | null;
  referredBy: string | null;
  affiliateActivated: boolean;
  affiliateActivationDate: string | null;
  totalReferrals: number;
  totalAffiliateEarnings: string;
  createdAt: string;
  updatedAt: string;
}

interface AffiliateActivity {
  id: number;
  referrerWallet: string;
  referredWallet: string;
  activityType: 'donation' | 'campaign_creation';
  relatedId: number | null;
  rewardAmount: string;
  rewardPaid: boolean;
  txHash: string | null;
  createdAt: string;
}

interface ReferralStats {
  totalReferrals: number;
  totalEarnings: string;
  activities: AffiliateActivity[];
}

interface DetailedAffiliateStats {
  overview: {
    totalReferrals: number;
    totalEarnings: string;
    unpaidRewards: string;
    paidRewards: string;
    conversionRate: number;
  };
  breakdown: {
    donations: { count: number; totalReward: string };
    campaigns: { count: number; totalReward: string };
  };
  monthlyStats: Array<{
    month: string;
    referrals: number;
    earnings: string;
  }>;
  recentActivity: AffiliateActivity[];
}

interface LeaderboardEntry {
  wallet: string;
  totalReferrals: number;
  totalEarnings: string;
  rank: number;
}

export default function AffiliatePage() {
  const [userWallet, setUserWallet] = useState<string>("");
  const [referralLink, setReferralLink] = useState<string>("");
  const [applicationText, setApplicationText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get connected wallet
  useEffect(() => {
    const getWallet = async () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            setUserWallet(accounts[0]);
            // Generate referral link when wallet is connected
            const { data: account } = await apiRequest("GET", `/api/account/${accounts[0]}`);
            if (account && account.referralCode) {
              setReferralLink(`${window.location.origin}?ref=${account.referralCode}`);
            }
          }
        } catch (error) {
          console.error("Error getting wallet:", error);
        }
      }
    };

    getWallet();
  }, []);

  // Get account data
  const { data: account, isLoading: accountLoading } = useQuery<Account>({
    queryKey: ["account", userWallet],
    enabled: !!userWallet,
  });

  // Get affiliate stats (basic)
  const { data: stats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: ["affiliate-stats", userWallet],
    enabled: !!userWallet,
  });

  // 🎯 NEW: Get detailed affiliate analytics
  const { data: detailedStats, isLoading: detailedLoading } = useQuery<DetailedAffiliateStats>({
    queryKey: ["affiliate", "detailed-stats", userWallet],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/affiliate/detailed-stats/${userWallet}`);
      return res.json();
    },
    enabled: !!userWallet,
  });

  // 🎯 NEW: Get unpaid rewards
  const { data: unpaidRewards, isLoading: unpaidLoading } = useQuery<AffiliateActivity[]>({
    queryKey: ["affiliate", "unpaid-rewards", userWallet],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/affiliate/unpaid-rewards/${userWallet}`);
      return res.json();
    },
    enabled: !!userWallet,
  });

  // 🎯 NEW: Get affiliate leaderboard
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["affiliate", "leaderboard"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/affiliate/leaderboard?limit=10`);
      return res.json();
    },
  });

  // Get affiliate application status
  const { data: applicationStatus } = useQuery({
    queryKey: ["affiliate-application-status", userWallet],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/affiliate/application-status/${userWallet}`);
      return res.json();
    },
    enabled: !!userWallet,
  });

  // Submit affiliate application mutation
  const submitApplicationMutation = useMutation({
    mutationFn: async (data: { wallet: string; applicationText: string }) => {
      const res = await apiRequest("POST", "/api/affiliate/apply", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Application Submitted!",
          description: "Your affiliate application has been submitted successfully. We'll review it soon.",
        });
        setApplicationText("");
        queryClient.invalidateQueries({ queryKey: ["affiliate-application-status"] });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to submit application",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      toast({
        title: "Link Copied!",
        description: "Referral link has been copied to clipboard",
      });
    }
  };

  const copyReferralCode = () => {
    if (account?.referralCode) {
      navigator.clipboard.writeText(account.referralCode);
      toast({
        title: "Code Copied!",
        description: "Referral code has been copied to clipboard",
      });
    }
  };

  const getActivityTypeLabel = (type: string) => {
    return type === 'donation' ? 'Made a Donation' : 'Created Campaign';
  };

  const getActivityBadgeVariant = (type: string) => {
    return type === 'donation' ? 'default' : 'secondary';
  };

  if (!userWallet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Affiliate Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please connect your wallet to access the affiliate dashboard.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accountLoading || statsLoading || detailedLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
          <p className="text-muted-foreground">Loading affiliate dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header with Home Button */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Affiliate Dashboard</h1>
            <p className="text-muted-foreground">Track your referrals and earnings</p>
          </div>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Share2 className="w-4 h-4 mr-2" />
          Affiliate Program
        </Badge>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{detailedStats?.overview.totalReferrals || 0}</div>
            <p className="text-xs text-muted-foreground">
              People you've referred
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parseFloat(detailedStats?.overview.totalEarnings || "0").toFixed(2)} USDT</div>
            <p className="text-xs text-muted-foreground">
              All-time affiliate rewards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Rewards</CardTitle>
            <Gift className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{parseFloat(detailedStats?.overview.unpaidRewards || "0").toFixed(2)} USDT</div>
            <p className="text-xs text-muted-foreground">
              Pending payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{(detailedStats?.overview.conversionRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Referral success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Affiliate Application Status */}
      {!account?.affiliateActivated && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {applicationStatus?.hasApplication ? (
                <>
                  <Clock className="w-5 h-5" />
                  Affiliate Application Status
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Become an Affiliate
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {applicationStatus?.hasApplication ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {applicationStatus.application.status === "pending" && (
                    <>
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                        Pending Review
                      </Badge>
                    </>
                  )}
                  {applicationStatus.application.status === "approved" && (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        Approved
                      </Badge>
                    </>
                  )}
                  {applicationStatus.application.status === "rejected" && (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <Badge variant="outline" className="text-red-600 border-red-300">
                        Rejected
                      </Badge>
                    </>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>Applied: {new Date(applicationStatus.application.appliedAt).toLocaleDateString()}</p>
                  {applicationStatus.application.reviewedAt && (
                    <p>Reviewed: {new Date(applicationStatus.application.reviewedAt).toLocaleDateString()}</p>
                  )}
                </div>

                {applicationStatus.application.reviewNotes && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Admin Notes:</h4>
                    <p className="text-sm">{applicationStatus.application.reviewNotes}</p>
                  </div>
                )}

                {applicationStatus.application.status === "pending" && (
                  <p className="text-sm text-muted-foreground">
                    Your application is being reviewed by our team. We'll notify you once it's processed.
                  </p>
                )}
                
                {applicationStatus.application.status === "rejected" && (
                  <p className="text-sm text-muted-foreground">
                    Your application was not approved this time. You can apply again after addressing the feedback.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Apply to become an affiliate and start earning rewards from referrals. 
                  Tell us why you'd be a great affiliate partner for DUXXAN.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Application Message</label>
                    <Textarea
                      placeholder="Tell us about yourself, your marketing experience, and why you want to join our affiliate program..."
                      value={applicationText}
                      onChange={(e) => setApplicationText(e.target.value)}
                      className="mt-1 min-h-[120px]"
                    />
                  </div>
                  
                  <Button 
                    onClick={() => submitApplicationMutation.mutate({
                      wallet: userWallet,
                      applicationText
                    })}
                    disabled={!applicationText.trim() || submitApplicationMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {submitApplicationMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Referral Tools */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Your Referral
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {account?.referralCode ? (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Your Referral Code</label>
                <div className="flex gap-2">
                  <Input 
                    value={account?.referralCode || ""} 
                    readOnly 
                    className="font-mono"
                  />
                  <Button 
                    onClick={copyReferralCode}
                    variant="outline"
                    size="icon"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Your Referral Link</label>
                <div className="flex gap-2">
                  <Input 
                    value={referralLink} 
                    readOnly 
                    className="text-sm"
                  />
                  <Button 
                    onClick={copyReferralLink}
                    variant="outline"
                    size="icon"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Activate Your Affiliate Status</h3>
              <p className="text-muted-foreground mb-4">
                Make your first donation or create a campaign to get your unique referral code
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => window.location.href = '/donations'}
                  variant="default"
                >
                  Make a Donation
                </Button>
                <Button 
                  onClick={() => window.location.href = '/create-campaign'}
                  variant="outline"
                >
                  Create Campaign
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 🎯 NEW: Performance Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Performance */}
        {detailedStats?.monthlyStats && detailedStats.monthlyStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Monthly Performance (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {detailedStats.monthlyStats.map((month) => (
                  <div key={month.month} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{month.month}</p>
                      <p className="text-sm text-muted-foreground">{month.referrals} referrals</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{parseFloat(month.earnings).toFixed(2)} USDT</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Breakdown */}
        {detailedStats?.breakdown && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Activity Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Donations</p>
                      <p className="text-sm text-muted-foreground">{detailedStats.breakdown.donations.count} activities</p>
                    </div>
                  </div>
                  <p className="font-medium">{parseFloat(detailedStats.breakdown.donations.totalReward).toFixed(2)} USDT</p>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Campaigns</p>
                      <p className="text-sm text-muted-foreground">{detailedStats.breakdown.campaigns.count} activities</p>
                    </div>
                  </div>
                  <p className="font-medium">{parseFloat(detailedStats.breakdown.campaigns.totalReward).toFixed(2)} USDT</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 🎯 NEW: Unpaid Rewards Tracking */}
      {unpaidRewards && unpaidRewards.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-yellow-500" />
              Pending Rewards ({unpaidRewards.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unpaidRewards.map((reward, index) => (
                <div key={reward.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <div>
                        <p className="font-medium">
                          {reward.referredWallet.slice(0, 6)}...{reward.referredWallet.slice(-4)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getActivityTypeLabel(reward.activityType)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Pending
                      </Badge>
                      <p className="text-sm font-medium mt-1">{parseFloat(reward.rewardAmount).toFixed(2)} USDT</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(reward.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {index < unpaidRewards.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🎯 NEW: Affiliate Leaderboard */}
      {leaderboard && leaderboard.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Affiliates Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaderboard.map((entry) => (
                <div key={entry.wallet} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      entry.rank === 1 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      entry.rank === 2 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                      entry.rank === 3 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      #{entry.rank}
                    </div>
                    <div>
                      <p className="font-medium font-mono">
                        {entry.wallet.slice(0, 6)}...{entry.wallet.slice(-4)}
                        {entry.wallet.toLowerCase() === userWallet.toLowerCase() && (
                          <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{entry.totalReferrals} referrals</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{parseFloat(entry.totalEarnings).toFixed(2)} USDT</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity History */}
      {stats?.activities && stats.activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Referral Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.activities.slice(0, 10).map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.rewardPaid ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="font-medium">
                          {activity.referredWallet.slice(0, 6)}...{activity.referredWallet.slice(-4)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getActivityTypeLabel(activity.activityType)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={activity.rewardPaid ? 'default' : 'secondary'}>
                        {activity.rewardPaid ? 'Paid' : 'Pending'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {index < Math.min(stats?.activities.length || 0, 10) - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}