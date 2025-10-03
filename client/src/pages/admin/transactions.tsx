import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Search,
  CreditCard,
  DollarSign,
  Filter,
  ExternalLink,
  Edit,
  Trash2
} from "lucide-react";

interface Donation {
  id: number;
  campaignId: number;
  donorWallet: string;
  amount: number;
  txHash: string;
  status: string;
  network: string;
  createdAt: string;
}

export default function AdminTransactionsPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [search, setSearch] = useState("");
  const [networkFilter, setNetworkFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/youhonor/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const { data: donations, isLoading: donationsLoading } = useQuery<Donation[]>({
    queryKey: ["/api/youhonor/donations"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/youhonor/donations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/youhonor/donations"] });
      toast({
        title: "Donation Deleted",
        description: "Donation has been permanently deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete donation.",
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

  const filteredDonations = donations?.filter(donation => {
    const matchesSearch = donation.txHash.toLowerCase().includes(search.toLowerCase()) ||
                         donation.donorWallet.toLowerCase().includes(search.toLowerCase());
    const matchesNetwork = networkFilter === "all" || donation.network === networkFilter;
    return matchesSearch && matchesNetwork;
  }) || [];

  const totalVolume = donations?.reduce((sum, d) => sum + d.amount, 0) || 0;

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
                <CreditCard className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Transaction Management</h1>
                <p className="text-sm text-muted-foreground">Monitor all platform transactions</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {donationsLoading ? "-" : donations?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {donationsLoading ? "-" : `$${totalVolume.toLocaleString()}`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Transactions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {donationsLoading ? "-" : donations?.filter(d => {
                  const today = new Date();
                  const donationDate = new Date(d.createdAt);
                  return donationDate.toDateString() === today.toDateString();
                }).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by tx hash or wallet..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={networkFilter} onValueChange={setNetworkFilter}>
                <SelectTrigger data-testid="select-network">
                  <SelectValue placeholder="Network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Networks</SelectItem>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="bsc">BSC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions ({filteredDonations.length})</CardTitle>
            <CardDescription>
              View all platform transaction history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {donationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found matching your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Donor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>TX Hash</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDonations.map((donation) => (
                      <TableRow key={donation.id} data-testid={`row-donation-${donation.id}`}>
                        <TableCell className="font-mono text-sm">{donation.id}</TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => setLocation(`/campaign/${donation.campaignId}`)}
                            className="p-0 h-auto"
                          >
                            #{donation.campaignId}
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {donation.donorWallet.slice(0, 6)}...{donation.donorWallet.slice(-4)}
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          ${donation.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {donation.network === 'ethereum' ? 'ETH' : 'BSC'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-500">
                            {donation.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <a
                            href={`https://${donation.network === 'ethereum' ? 'etherscan.io' : 'bscscan.com'}/tx/${donation.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-primary hover:underline"
                          >
                            <span>{donation.txHash.slice(0, 8)}...</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(donation.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocation(`/youhonor/donations/${donation.id}/edit`)}
                              data-testid={`button-edit-${donation.id}`}
                              title="Edit Donation"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this donation? This action cannot be undone.')) {
                                  deleteMutation.mutate(donation.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-delete-${donation.id}`}
                              title="Delete Donation"
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
