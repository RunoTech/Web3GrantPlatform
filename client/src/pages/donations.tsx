import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import CampaignCard from "@/components/CampaignCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Search, 
  Users,
  Target,
  Filter,
  SortDesc,
  Gift,
  Heart
} from "lucide-react";
import type { Campaign } from "@shared/schema";

export default function DonationsPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterCategory, setFilterCategory] = useState("all");

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["/api/get-campaigns"],
  });

  const { data: popularCampaigns = [] } = useQuery({
    queryKey: ["/api/get-popular-campaigns"],
  });

  // Filter and sort campaigns
  const filteredCampaigns = (campaigns as Campaign[]).filter((campaign: Campaign) => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterCategory === "popular") {
      return matchesSearch && campaign.featured;
    }
    
    return matchesSearch;
  }).sort((a: Campaign, b: Campaign) => {
    switch (sortBy) {
      case "donations":
        return parseFloat(b.totalDonations || '0') - parseFloat(a.totalDonations || '0');
      case "supporters":
        return (b.donationCount || 0) - (a.donationCount || 0);
      default:
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    }
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header currentPage="donations" />

      {/* Hero Section */}
      <section className="section-spacing-lg bg-surface-primary">
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="w-24 h-24 bg-primary rounded-lg flex items-center justify-center mx-auto shadow-binance">
              <Gift className="w-12 h-12 icon-on-primary" />
            </div>
            
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                {t('donations.title')}
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
                {t('donations.subtitle')}
              </p>
              
              {/* Create Campaign Button */}
              <div className="flex justify-center">
                <Button 
                  asChild 
                  size="lg"
                  className="btn-binance px-8 py-4 shadow-binance hover:shadow-lg transition-all duration-200"
                >
                  <Link href="/create-campaign?type=donate">
                    <Target className="w-6 h-6 mr-2 icon-on-yellow" />
                    {t('donations.create_campaign')}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="card-standard text-center">
                <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 icon-on-yellow" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('donations.features.reach_goal')}</h3>
                <p className="text-sm text-muted-foreground">{t('donations.features.reach_desc')}</p>
              </div>
              <div className="card-standard text-center">
                <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 icon-on-yellow" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('donations.features.support_community')}</h3>
                <p className="text-sm text-muted-foreground">{t('donations.features.support_desc')}</p>
              </div>
              <div className="card-standard text-center">
                <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 icon-on-yellow" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('donations.features.secure_donation')}</h3>
                <p className="text-sm text-muted-foreground">{t('donations.features.secure_desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Campaigns Section */}
      <section className="section-spacing-lg bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('donations.popular_campaigns')}
            </h2>
            <p className="text-lg text-muted-foreground">{t('donations.popular_subtitle')}</p>
          </div>

          <div className="campaign-grid mb-12">
            {(popularCampaigns as Campaign[]).slice(0, 6).map((campaign: Campaign) => (
              <div key={campaign.id} className="relative">
                <div className="absolute -top-3 -right-3 z-10">
                  <Badge className="bg-primary text-primary-foreground animate-pulse">
                    🌟 {t('donations.filter_popular')}
                  </Badge>
                </div>
                <CampaignCard campaign={campaign} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Campaigns Section */}
      <section className="section-spacing-lg bg-surface-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Search and Filter Header */}
            <div className="card-standard">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      type="text"
                      placeholder={t('donations.search_placeholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 bg-surface-2 border-border"
                      data-testid="input-search-campaigns"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <select 
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-3 py-2 bg-surface-2 border border-border rounded-lg text-foreground"
                    >
                      <option value="all">{t('donations.filter_all')}</option>
                      <option value="popular">{t('donations.filter_popular')}</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <SortDesc className="w-4 h-4 text-muted-foreground" />
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 bg-surface-2 border border-border rounded-lg text-foreground"
                    >
                      <option value="recent">{t('donations.sort_recent')}</option>
                      <option value="donations">{t('donations.sort_donations')}</option>
                      <option value="supporters">{t('donations.sort_supporters')}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-foreground">
                {t('donations.all_campaigns')}
              </h3>
              <Badge variant="outline" className="text-muted-foreground">
                {filteredCampaigns.length} {t('donations.campaigns_found')}
              </Badge>
            </div>

            {/* Campaigns Grid */}
            {isLoading ? (
              <div className="campaign-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card-modern p-6 animate-pulse">
                    <div className="h-48 bg-slate-200 rounded-xl mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCampaigns.length > 0 ? (
              <div className="campaign-grid" data-testid="campaigns-grid">
                {filteredCampaigns.map((campaign: Campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-primary rounded-lg flex items-center justify-center mx-auto mb-6 shadow-binance">
                  <Search className="w-12 h-12 icon-on-yellow" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  {searchTerm ? t('donations.no_results') : t('donations.no_campaigns')}
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {searchTerm 
                    ? t('donations.search_different')
                    : t('donations.waiting_first')
                  }
                </p>
                {!searchTerm && (
                  <Button asChild className="btn-binance">
                    <Link href="/create-campaign?type=donate">
                      {t('donations.create_campaign')}
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-spacing-lg bg-surface-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="card-standard p-12 bg-primary relative overflow-hidden">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
                {t('donations.make_difference')}
              </h2>
              <p className="text-xl text-primary-foreground/90">
                {t('donations.create_own')}
              </p>
              <Button 
                asChild 
                size="lg"
                className="bg-background text-primary hover:bg-background/90 text-lg px-8 py-4 font-semibold"
              >
                <Link href="/create-campaign?type=donate">
                  <Target className="w-5 h-5 mr-2" />
                  {t('donations.create_campaign')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}