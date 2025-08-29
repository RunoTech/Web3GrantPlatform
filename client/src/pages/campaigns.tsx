import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WalletConnectButton from "@/components/WalletConnectButton";
import CampaignCard from "@/components/CampaignCard";
import CryptoOnramp from "@/components/CryptoOnramp";
import LanguageSelector from "@/components/LanguageSelector";
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
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 cyber-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="hover:text-cyber-cyan">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('back')}
                </Button>
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center neon-border">
                  <Heart className="w-6 h-6 text-black" />
                </div>
                <h1 className="text-xl font-bold neon-text uppercase tracking-wide">
                  {t('duxxan')}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <CryptoOnramp 
                targetAmount={100}
                targetCurrency="USDT"
                onSuccess={(txHash) => {
                  toast({
                    title: "Kripto Satın Alındı!",
                    description: "Artık bağış yapabilirsiniz.",
                  });
                }}
                onError={(error) => {
                  toast({
                    title: "Hata",
                    description: error,
                    variant: "destructive",
                  });
                }}
              />
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Header Section */}
      <section className="py-12 cyber-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 neon-border">
              <Search className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold neon-text uppercase tracking-wide">
              {t('donations.all_campaigns')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('donations.subtitle')}
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={t('donations.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 rounded-2xl border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                data-testid="input-search-campaigns"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Campaigns Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 shadow-lg animate-pulse">
                  <div className="h-48 bg-slate-200 rounded-2xl mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="campaigns-grid">
              {filteredCampaigns.map((campaign: Campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 mb-2">
                {searchTerm ? t('donations.no_results') : t('donations.no_campaigns')}
              </h3>
              <p className="text-slate-600 mb-8">
                {searchTerm 
                  ? t('donations.search_different')
                  : t('donations.waiting_first')
                }
              </p>
              {!searchTerm && (
                <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-600 text-black px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
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
