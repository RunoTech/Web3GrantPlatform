import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  CreditCard, 
  Briefcase, 
  Trophy, 
  Settings, 
  Database, 
  Gift,
  Link as LinkIcon,
  Shield,
  Activity,
  TrendingUp,
  DollarSign,
  Calendar
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalCampaigns: number;
  pendingCampaigns: number;
  totalDonations: string;
  totalDonationCount: number;
  todayEntries: number;
}

export default function AdminDashboardPage() {
  const [, setLocation] = useLocation();
  const { admin, isAuthenticated, isLoading, logout } = useAdminAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/youhonor/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/youhonor/dashboard/stats"],
    enabled: isAuthenticated,
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">DUXXAN Admin</h1>
                <p className="text-sm text-muted-foreground">Dashboard & Platform Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{admin?.username}</p>
                <Badge variant="secondary" className="text-xs">
                  {admin?.role || 'Admin'}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                data-testid="button-admin-logout"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {admin?.username}!</h2>
          <p className="text-muted-foreground">
            Manage your platform, monitor activities, and control settings from this dashboard.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-users-stats">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "-" : stats?.totalUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {statsLoading ? "-" : stats?.activeUsers || 0} active users
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-campaigns-stats">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "-" : stats?.totalCampaigns || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {statsLoading ? "-" : stats?.pendingCampaigns || 0} pending approval
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-donations-stats">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "-" : `$${stats?.totalDonations || "0"}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {statsLoading ? "-" : stats?.totalDonationCount || 0} total donations
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-daily-entries-stats">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Entries</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "-" : stats?.todayEntries || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Daily reward participants
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>
              Frequently used admin functions and management tools.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col space-y-2"
                onClick={() => setLocation("/youhonor/settings")}
                data-testid="button-admin-settings"
              >
                <Settings className="h-6 w-6" />
                <span>Platform Settings</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex-col space-y-2"
                onClick={() => setLocation("/youhonor/daily-rewards")}
                data-testid="button-admin-daily-rewards"
              >
                <Gift className="h-6 w-6" />
                <span>Daily Rewards</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col space-y-2"
                onClick={() => setLocation("/youhonor/database")}
                data-testid="button-admin-database"
              >
                <Database className="h-6 w-6" />
                <span>Database</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col space-y-2"
                onClick={() => setLocation("/youhonor/campaigns")}
                data-testid="button-admin-campaigns"
              >
                <Briefcase className="h-6 w-6" />
                <span>Manage Campaigns</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col space-y-2"
                onClick={() => setLocation("/youhonor/transactions")}
                data-testid="button-admin-transactions"
              >
                <CreditCard className="h-6 w-6" />
                <span>Transactions</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col space-y-2"
                onClick={() => setLocation("/youhonor/affiliates")}
                data-testid="button-admin-affiliates"
              >
                <TrendingUp className="h-6 w-6" />
                <span>Affiliate System</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Platform Activity</span>
            </CardTitle>
            <CardDescription>
              Latest events and system updates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-muted-foreground">Admin panel initialized successfully</span>
                <span className="text-xs text-muted-foreground ml-auto">Just now</span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-muted-foreground">JWT authentication system active</span>
                <span className="text-xs text-muted-foreground ml-auto">System</span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span className="text-muted-foreground">Database connection established</span>
                <span className="text-xs text-muted-foreground ml-auto">System</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}