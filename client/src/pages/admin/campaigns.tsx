import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft,
  Search,
  Check,
  X,
  Eye,
  Shield,
  Briefcase,
  DollarSign,
  Users,
  Filter,
  Edit,
  Trash2
} from "lucide-react";

interface Campaign {
  id: number;
  title: string;
  description: string;
  ownerWallet: string;
  targetAmount: number;
  totalDonations: number;
  donationCount: number;
  campaignType: 'FUND' | 'DONATE';
  creatorType: string;
  approved: boolean;
  active: boolean;
  createdAt: string;
}

export default function AdminCampaignsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/youhonor/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/youhonor/campaigns"],
    enabled: isAuthenticated,
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/youhonor/campaigns/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/youhonor/campaigns"] });
      toast({
        title: "Campaign Approved",
        description: "Campaign has been approved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve campaign.",
        variant: "destructive",
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/youhonor/campaigns/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/youhonor/campaigns"] });
      toast({
        title: "Campaign Rejected",
        description: "Campaign has been rejected.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject campaign.",
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/youhonor/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/youhonor/campaigns"] });
      toast({
        title: "Campaign Deleted",
        description: "Campaign has been permanently deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete campaign.",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const filteredCampaigns = campaigns?.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(search.toLowerCase()) ||
                         campaign.ownerWallet.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || campaign.campaignType === typeFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "approved" && campaign.approved) ||
                         (statusFilter === "pending" && !campaign.approved);
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/youhonor")}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Campaign Management</h1>
                <p className="text-sm text-muted-foreground">Review and manage all platform campaigns</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger data-testid="select-type">
                  <SelectValue placeholder="Campaign Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="DONATE">DONATE</SelectItem>
                  <SelectItem value="FUND">FUND</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Campaigns Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Campaigns ({filteredCampaigns.length})</CardTitle>
                <CardDescription>
                  Manage campaign approvals and view details
                </CardDescription>
              </div>
              <Button
                onClick={() => setLocation("/youhonor/campaigns/create")}
                data-testid="button-create-campaign"
              >
                <Shield className="h-4 w-4 mr-2" />
                Create New Campaign
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {campaignsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No campaigns found matching your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Raised</TableHead>
                      <TableHead>Donations</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map((campaign) => (
                      <TableRow key={campaign.id} data-testid={`row-campaign-${campaign.id}`}>
                        <TableCell className="font-mono text-sm">{campaign.id}</TableCell>
                        <TableCell className="max-w-xs truncate">{campaign.title}</TableCell>
                        <TableCell>
                          <Badge variant={campaign.campaignType === 'FUND' ? 'default' : 'secondary'}>
                            {campaign.campaignType}
                          </Badge>
                        </TableCell>
                        <TableCell>${campaign.targetAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          ${campaign.totalDonations.toLocaleString()}
                        </TableCell>
                        <TableCell>{campaign.donationCount}</TableCell>
                        <TableCell>
                          {campaign.approved ? (
                            <Badge className="bg-green-500">Approved</Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocation(`/campaign/${campaign.id}`)}
                              data-testid={`button-view-${campaign.id}`}
                              title="View Campaign"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocation(`/youhonor/campaigns/${campaign.id}/edit`)}
                              data-testid={`button-edit-${campaign.id}`}
                              title="Edit Campaign"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!campaign.approved && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => approveMutation.mutate(campaign.id)}
                                  disabled={approveMutation.isPending}
                                  className="text-green-600 hover:text-green-700"
                                  data-testid={`button-approve-${campaign.id}`}
                                  title="Approve Campaign"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => rejectMutation.mutate(campaign.id)}
                                  disabled={rejectMutation.isPending}
                                  className="text-red-600 hover:text-red-700"
                                  data-testid={`button-reject-${campaign.id}`}
                                  title="Reject Campaign"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
                                  deleteMutation.mutate(campaign.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-delete-${campaign.id}`}
                              title="Delete Campaign"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
