import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Copy, Users, DollarSign, Gift, Share2, TrendingUp } from "lucide-react";
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

export default function AffiliatePage() {
  const [userWallet, setUserWallet] = useState<string>("");
  const [referralLink, setReferralLink] = useState<string>("");
  const { toast } = useToast();

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

  // Get affiliate stats
  const { data: stats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: ["affiliate-stats", userWallet],
    enabled: !!userWallet,
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

  if (accountLoading || statsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Affiliate Program</h1>
        <p className="text-muted-foreground">
          Earn rewards by referring new users to DUXXAN platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{account?.totalReferrals || 0}</div>
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
            <div className="text-2xl font-bold">${account?.totalAffiliateEarnings || "0.00"}</div>
            <p className="text-xs text-muted-foreground">
              Affiliate rewards earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affiliate Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {account?.affiliateActivated ? (
                <Badge variant="default">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {account?.affiliateActivated 
                ? "Earning affiliate rewards"
                : "Make your first donation/campaign to activate"
              }
            </p>
          </CardContent>
        </Card>
      </div>

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
                    value={account.referralCode} 
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

      {/* Activity History */}
      {stats && stats.activities && stats.activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Referral Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.activities.map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full" />
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
                      <Badge variant={getActivityBadgeVariant(activity.activityType)}>
                        {activity.activityType}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {index < stats.activities.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}