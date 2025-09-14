import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WalletConnectButton from "@/components/WalletConnectButton";
import CampaignCard from "@/components/CampaignCard";
import CryptoOnramp from "@/components/CryptoOnramp";
import LanguageSelector from "@/components/LanguageSelector";
import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Heart, Search, ArrowLeft, CreditCard } from "lucide-react";
import type { Campaign } from "@shared/schema";

export default function CampaignsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useLanguage();
  const { toast } = useToast();

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/get-campaigns"],
  });

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
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
          </div>
        </div>
      </section>

      {/* Campaigns Grid */}
      <section className="section-spacing-lg surface-primary">
        <div className="container-main">
          {isLoading ? (
            <div className="campaign-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-standard animate-pulse">
                  <div className="h-48 bg-muted rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
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
            <div className="text-center section-spacing-lg">
              <div className="w-24 h-24 surface-secondary rounded-lg flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 icon-secondary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-2">
                {searchTerm ? t('donations.no_results') : t('donations.no_campaigns')}
              </h3>
              <p className="text-muted-foreground mb-8">
                {searchTerm 
                  ? t('donations.search_different')
                  : t('donations.waiting_first')
                }
              </p>
              {!searchTerm && (
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
    </div>
  );
}
