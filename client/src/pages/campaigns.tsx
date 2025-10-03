import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WalletConnectButton from "@/components/WalletConnectButton";
import CampaignCard from "@/components/CampaignCard";
import LanguageSelector from "@/components/LanguageSelector";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { updateMetaTags } from "@/utils/seo";
import { Heart, Search, ArrowLeft, CreditCard, Filter, X, SlidersHorizontal } from "lucide-react";
import type { Campaign } from "@shared/schema";
import CampaignGridSkeleton from "@/components/skeletons/CampaignGridSkeleton";

interface FilterState {
  search: string;
  campaignType: string;
  creatorType: string;
  status: string;
  minAmount: string;
  maxAmount: string;
  sortBy: string;
  creditCardEnabled: string;
}

export default function CampaignsPage() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    campaignType: "",
    creatorType: "",
    status: "",
    minAmount: "",
    maxAmount: "",
    sortBy: "newest",
    creditCardEnabled: ""
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();

  // SEO meta tags
  useEffect(() => {
    updateMetaTags({
      title: 'Tüm Kampanyalar - DUXXAN',
      description: 'Blockchain tabanlı şeffaf bağış platformunda aktif kampanyaları keşfedin. Bağış ve kurumsal fon kampanyalarını inceleyin, filtreleyin ve destek olun.',
      url: `${window.location.origin}/campaigns`,
    });
  }, []);

  // Build hierarchical query key and fetch URL
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.campaignType) params.append('campaignType', filters.campaignType);
    if (filters.creatorType) params.append('creatorType', filters.creatorType);
    if (filters.status) params.append('status', filters.status);
    if (filters.minAmount) params.append('minAmount', filters.minAmount);
    if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.creditCardEnabled) params.append('creditCardEnabled', filters.creditCardEnabled);
    
    return params.toString();
  };

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/get-campaigns', filters],
    queryFn: () => fetch(`/api/get-campaigns?${buildQueryParams()}`).then(res => res.json()),
  });

  // Debounced search to prevent excessive API calls
  const [searchTerm, setSearchTerm] = useState(filters.search);
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateFilter('search', searchTerm);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);
  
  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      campaignType: "",
      creatorType: "",
      status: "",
      minAmount: "",
      maxAmount: "",
      sortBy: "newest",
      creditCardEnabled: ""
    });
  };

  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => 
      value !== "" && key !== "sortBy"
    ).length;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header currentPage="campaigns" />

      {/* Header Section */}
      <section className="section-spacing-lg surface-secondary">
        <div className="container-main">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-binance">
              <Search className="w-8 h-8 icon-on-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {t('donations.all_campaigns')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('donations.subtitle')}
            </p>
            
            {/* Search & Filter Bar */}
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-secondary w-5 h-5" />
                <Input
                  type="text"
                  placeholder={t('donations.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 rounded-lg border focus:border-primary focus:ring-primary"
                  data-testid="input-search-campaigns"
                />
              </div>
              
              {/* Filter Toggle Button */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 touch-manipulation"
                  data-testid="button-toggle-filters"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Advanced Filters
                  {getActiveFilterCount() > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {getActiveFilterCount()}
                    </Badge>
                  )}
                </Button>
                
                {getActiveFilterCount() > 0 && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="flex items-center gap-2 touch-manipulation text-sm"
                    data-testid="button-clear-filters"
                  >
                    <X className="w-4 h-4" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
            
            {/* Advanced Filters Panel */}
            {showFilters && (
              <Card className="max-w-4xl mx-auto mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filter Campaigns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    
                    {/* Creator Type */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Creator Type</label>
                      <Select value={filters.creatorType} onValueChange={(value) => updateFilter('creatorType', value)}>
                        <SelectTrigger data-testid="select-creator-type">
                          <SelectValue placeholder="All Creators" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Creators</SelectItem>
                          <SelectItem value="citizen">Individual</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                          <SelectItem value="association">Association</SelectItem>
                          <SelectItem value="foundation">Foundation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Status */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="featured">Featured</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Amount Range */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Min Amount (USDT)</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={filters.minAmount}
                        onChange={(e) => updateFilter('minAmount', e.target.value)}
                        className="touch-manipulation"
                        data-testid="input-min-amount"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max Amount (USDT)</label>
                      <Input
                        type="number"
                        placeholder="No limit"
                        value={filters.maxAmount}
                        onChange={(e) => updateFilter('maxAmount', e.target.value)}
                        className="touch-manipulation"
                        data-testid="input-max-amount"
                      />
                    </div>
                    
                    {/* Payment Method */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Payment Method</label>
                      <Select value={filters.creditCardEnabled} onValueChange={(value) => updateFilter('creditCardEnabled', value)}>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue placeholder="All Methods" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Methods</SelectItem>
                          <SelectItem value="true">Credit Card Enabled</SelectItem>
                          <SelectItem value="false">Crypto Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Sort & Results Bar */}
      <section className="py-4 border-b border-border">
        <div className="container-main">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {isLoading ? "Loading..." : `${campaigns.length} campaigns found`}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sort by:</span>
              <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                <SelectTrigger className="w-48" data-testid="select-sort-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="most_funded">Most Funded</SelectItem>
                  <SelectItem value="ending_soon">Ending Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Campaigns Grid */}
      <section className="section-spacing-lg surface-primary">
        <div className="container-main">
          {isLoading ? (
            <CampaignGridSkeleton count={8} />
          ) : campaigns.length > 0 ? (
            <div className="campaign-grid" data-testid="campaigns-grid">
              {campaigns.map((campaign: Campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <div className="text-center section-spacing-lg">
              <div className="w-24 h-24 surface-secondary rounded-lg flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 icon-secondary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-2">
                {getActiveFilterCount() > 0 ? t('donations.no_results') : t('donations.no_campaigns')}
              </h3>
              <p className="text-muted-foreground mb-8">
                {getActiveFilterCount() > 0
                  ? t('donations.search_different')
                  : t('donations.waiting_first')
                }
              </p>
              {getActiveFilterCount() === 0 && (
                <Button asChild className="btn-binance px-8 py-3 rounded-lg font-semibold shadow-binance hover:transform hover:-translate-y-0.5 transition-all duration-300">
                  <Link href="/create-campaign?type=donate">
                    {t('donations.create_campaign')}
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
