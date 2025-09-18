import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/hooks/useWallet";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search,
  Filter,
  ExternalLink,
  Calendar,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";

interface Donation {
  id: number;
  amount: string;
  txHash: string;
  network: string;
  createdAt: string;
  campaignId: number;
  campaignTitle: string;
  campaignType: string;
  campaignOwner: string;
}

interface DonationFilters {
  startDate: string;
  endDate: string;
  minAmount: string;
  campaignType: string;
  limit: number;
}

export default function DonationHistoryTable() {
  const { address, isConnected } = useWallet();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DonationFilters>({
    startDate: '',
    endDate: '',
    minAmount: '',
    campaignType: '',
    limit: 50
  });

  const { data: donations = [], isLoading, refetch } = useQuery<Donation[]>({
    queryKey: ["/api/analytics/donations", address, filters],
    enabled: isConnected && !!address,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.campaignType) params.append('campaignType', filters.campaignType);
      params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/analytics/donations/${address}?${params}`, {
        credentials: 'include' // CRITICAL: Include authentication cookies
      });
      if (!response.ok) throw new Error('Failed to fetch donation history');
      return response.json();
    }
  });

  const updateFilter = (key: keyof DonationFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      minAmount: '',
      campaignType: '',
      limit: 50
    });
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== '' && value !== 50).length;
  };

  const getExplorerUrl = (txHash: string, network: string) => {
    const baseUrl = network === 'ethereum' ? 'https://etherscan.io' : 'https://bscscan.com';
    return `${baseUrl}/tx/${txHash}`;
  };

  if (!isConnected || !address) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground">Connect your wallet to view your donation history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full" data-testid="donation-history-table">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Donation History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filter Panel */}
        {showFilters && (
          <div className="p-4 border rounded-lg bg-muted/10 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => updateFilter('startDate', e.target.value)}
                  data-testid="input-start-date"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => updateFilter('endDate', e.target.value)}
                  data-testid="input-end-date"
                />
              </div>

              {/* Min Amount */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Amount (USDT)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={filters.minAmount}
                  onChange={(e) => updateFilter('minAmount', e.target.value)}
                  data-testid="input-min-amount"
                />
              </div>

              {/* Campaign Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Campaign Type</label>
                <Select value={filters.campaignType} onValueChange={(value) => updateFilter('campaignType', value)}>
                  <SelectTrigger data-testid="select-campaign-type">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="DONATE">Donations</SelectItem>
                    <SelectItem value="FUND">Business Funding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={() => refetch()} data-testid="button-apply-filters">
                Apply Filters
              </Button>
              {getActiveFilterCount() > 0 && (
                <Button variant="ghost" onClick={clearFilters} data-testid="button-clear-filters">
                  Clear All
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Donations Table */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : donations.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Transaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.map((donation) => (
                  <TableRow key={donation.id}>
                    <TableCell className="max-w-[200px]">
                      <div className="space-y-1">
                        <p className="font-medium truncate">{donation.campaignTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {donation.campaignId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary">
                        {parseFloat(donation.amount).toFixed(4)} USDT
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={donation.campaignType === 'DONATE' ? 'default' : 'secondary'}>
                        {donation.campaignType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{donation.network.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">{format(new Date(donation.createdAt), 'MMM dd, yyyy')}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(donation.createdAt), 'HH:mm:ss')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        data-testid={`button-view-tx-${donation.id}`}
                      >
                        <a
                          href={getExplorerUrl(donation.txHash, donation.network)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1"
                        >
                          <span className="text-xs font-mono">
                            {donation.txHash.slice(0, 8)}...{donation.txHash.slice(-6)}
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Donations Found</h3>
            <p className="text-muted-foreground">
              {getActiveFilterCount() > 0 ? 'Try adjusting your filters' : 'No donations made yet'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}