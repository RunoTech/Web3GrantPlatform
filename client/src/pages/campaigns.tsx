import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WalletConnectButton from "@/components/WalletConnectButton";
import CampaignCard from "@/components/CampaignCard";
import { Heart, Search, ArrowLeft } from "lucide-react";
import type { Campaign } from "@shared/schema";

export default function CampaignsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["/api/get-campaigns"],
  });

  const filteredCampaigns = campaigns.filter((campaign: Campaign) =>
    campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Web3Bağış
              </h1>
            </div>

            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">
                Ana Sayfa
              </Link>
              <Link href="/campaigns" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">
                Kampanyalar
              </Link>
              <Link href="/create-campaign" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">
                Kampanya Oluştur
              </Link>
            </nav>

            <WalletConnectButton />
          </div>
        </div>
      </header>

      {/* Header Section */}
      <section className="py-12 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-8">
            <Button variant="ghost" asChild data-testid="button-back-home">
              <Link href="/">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Ana Sayfaya Dön
              </Link>
            </Button>
          </div>
          
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800">
              Tüm Kampanyalar
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Toplumsal değişime katkıda bulunmak için destekleyebileceğiniz kampanyaları keşfedin
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Kampanya ara..."
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
                {searchTerm ? "Arama sonucu bulunamadı" : "Henüz kampanya yok"}
              </h3>
              <p className="text-slate-600 mb-8">
                {searchTerm 
                  ? "Farklı anahtar kelimeler deneyerek tekrar arayın"
                  : "İlk kampanyayı siz oluşturun ve toplumsal değişime öncülük edin"
                }
              </p>
              {!searchTerm && (
                <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                  <Link href="/create-campaign">
                    Kampanya Oluştur
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
