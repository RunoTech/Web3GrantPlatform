import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/utils/api";
import { 
  ArrowLeft, 
  Trophy,
  Gift,
  DollarSign,
  Users,
  Calendar,
  Clock,
  Coins,
  Award,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Copy
} from "lucide-react";

export default function AdminDailyRewardsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [winnerWallet, setWinnerWallet] = useState('');
  const [rewardAmount, setRewardAmount] = useState('100');

  // Get today's entries
  const { data: todayEntries = [], isLoading: entriesLoading } = useQuery<any[]>({
    queryKey: ["/api/youhonor/daily-entries", selectedDate],
  });

  // Get today's winner (if any)
  const { data: todayWinner } = useQuery<any>({
    queryKey: ["/api/youhonor/daily-winner", selectedDate],
  });

  // Get overall stats
  const { data: dailyStats } = useQuery<any>({
    queryKey: ["/api/youhonor/daily-stats"],
  });

  // Random winner selection mutation
  const selectRandomWinnerMutation = useMutation({
    mutationFn: (date: string) => api.post(`/api/youhonor/select-random-winner`, { date, amount: rewardAmount }),
    onSuccess: (data) => {
      toast({
        title: "Winner Selected!",
        description: `Random winner selected for ${selectedDate}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/youhonor/daily-winner"] });
      queryClient.invalidateQueries({ queryKey: ["/api/get-last-winners"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to select winner",
        variant: "destructive",
      });
    },
  });

  // Manual winner selection mutation
  const selectManualWinnerMutation = useMutation({
    mutationFn: (data: { date: string; wallet: string; amount: string }) => 
      api.post(`/api/youhonor/select-manual-winner`, data),
    onSuccess: () => {
      toast({
        title: "Winner Selected!",
        description: `Manual winner selected for ${selectedDate}`,
      });
      setWinnerWallet('');
      queryClient.invalidateQueries({ queryKey: ["/api/youhonor/daily-winner"] });
      queryClient.invalidateQueries({ queryKey: ["/api/get-last-winners"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to select winner",
        variant: "destructive",
      });
    },
  });

  const handleRandomWinner = () => {
    selectRandomWinnerMutation.mutate(selectedDate);
  };

  const handleManualWinner = () => {
    if (!winnerWallet.trim()) {
      toast({
        title: "Error",
        description: "Please enter a wallet address",
        variant: "destructive",
      });
      return;
    }
    selectManualWinnerMutation.mutate({
      date: selectedDate,
      wallet: winnerWallet.trim(),
      amount: rewardAmount
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header currentPage="admin" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/youhonor/settings">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Admin Panel
          </Link>
        </Button>

        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <Gift className="w-12 h-12 text-yellow-500" />
              <h1 className="text-4xl font-bold text-black dark:text-white">
                Daily Rewards Management
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Manage daily reward entries and select winners
            </p>
          </div>

          {/* Statistics Overview */}
          {dailyStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-black dark:text-white">
                        {dailyStats.totalEntries || 0}
                      </div>
                      <div className="text-sm text-gray-500">Total Entries</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-black dark:text-white">
                        {dailyStats.totalWinners || 0}
                      </div>
                      <div className="text-sm text-gray-500">Total Winners</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-black dark:text-white">
                        {dailyStats.totalRewards || 0}
                      </div>
                      <div className="text-sm text-gray-500">Total Rewards (USDT)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-black dark:text-white">
                        {dailyStats.activeDays || 0}
                      </div>
                      <div className="text-sm text-gray-500">Active Days</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Date Selection and Winner Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Winner Selection</span>
                </CardTitle>
                <CardDescription>
                  Select a winner for the daily reward draw
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="date">Select Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Reward Amount (USDT)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(e.target.value)}
                    className="mt-1"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Today's Winner Status */}
                {todayWinner ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-200">
                        Winner Already Selected
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Winner:</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-green-700 dark:text-green-300">
                            {todayWinner.wallet.slice(0, 8)}...{todayWinner.wallet.slice(-6)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(todayWinner.wallet)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                        <span className="font-bold text-green-700 dark:text-green-300">
                          {todayWinner.amount} USDT
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800 dark:text-yellow-200">
                        No Winner Selected Yet
                      </span>
                    </div>
                  </div>
                )}

                {!todayWinner && (
                  <div className="space-y-4">
                    {/* Random Winner Selection */}
                    <Button
                      onClick={handleRandomWinner}
                      disabled={selectRandomWinnerMutation.isPending || entriesLoading || todayEntries.length === 0}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                    >
                      {selectRandomWinnerMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trophy className="w-4 h-4 mr-2" />
                      )}
                      Select Random Winner ({todayEntries.length} entries)
                    </Button>

                    {/* Manual Winner Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="winner-wallet">Or Select Manual Winner</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="winner-wallet"
                          placeholder="0x..."
                          value={winnerWallet}
                          onChange={(e) => setWinnerWallet(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleManualWinner}
                          disabled={selectManualWinnerMutation.isPending}
                          variant="outline"
                        >
                          {selectManualWinnerMutation.isPending ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Award className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Entries List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Daily Entries ({selectedDate})</span>
                </CardTitle>
                <CardDescription>
                  List of participants for the selected date
                </CardDescription>
              </CardHeader>
              <CardContent>
                {entriesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : todayEntries.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {todayEntries.map((entry: any, index: number) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                            #{index + 1}
                          </div>
                          <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                            {entry.wallet.slice(0, 8)}...{entry.wallet.slice(-6)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {new Date(entry.createdAt).toLocaleTimeString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(entry.wallet)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <div className="text-gray-500 dark:text-gray-400">
                      No entries for this date
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}