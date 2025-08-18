import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WalletConnectButton from "@/components/WalletConnectButton";
import CampaignCard from "@/components/CampaignCard";
import { 
  Heart, 
  Search, 
  ArrowLeft, 
  TrendingUp,
  Users,
  Target,
  Filter,
  SortDesc,
  Gift
} from "lucide-react";
import type { Campaign } from "@shared/schema";

export default function DonationsPage() {
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
  const filteredCampaigns = campaigns.filter((campaign: Campaign) => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterCategory === "popular") {
      return matchesSearch && campaign.featured;
    }
    
    return matchesSearch;
  }).sort((a: Campaign, b: Campaign) => {
    switch (sortBy) {
      case "donations":
        return (b.totalDonations || 0) - (a.totalDonations || 0);
      case "supporters":
        return (b.donationCount || 0) - (a.donationCount || 0);
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 glass-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-primary rounded-2xl flex items-center justify-center">
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
              <Link href="/donations" className="text-blue-600 font-semibold">
                Bağışlar
              </Link>
              <Link href="/funds" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">
                Fonlar
              </Link>
              <Link href="/profile" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">
                Profil
              </Link>
            </nav>

            <WalletConnectButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-32 h-32 modern-blue rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 modern-purple rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="w-24 h-24 gradient-primary rounded-3xl flex items-center justify-center mx-auto animate-glow">
              <Gift className="w-12 h-12 text-white" />
            </div>
            
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-4">
                Bağış <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Merkezi</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Anlamlı projeleri keşfedin ve destekleyin. Her bağış, daha iyi bir dünya için atılan adımdır.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="card-modern p-6 text-center">
                <Target className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-800 mb-1">Hedefe Ulaş</h3>
                <p className="text-sm text-slate-600">Projelerin hedeflerine ulaşmasına yardım et</p>
              </div>
              <div className="card-modern p-6 text-center">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-800 mb-1">Toplumu Destekle</h3>
                <p className="text-sm text-slate-600">Toplumsal değişime katkıda bulun</p>
              </div>
              <div className="card-modern p-6 text-center">
                <Heart className="w-8 h-8 text-pink-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-800 mb-1">Güvenli Bağış</h3>
                <p className="text-sm text-slate-600">Blockchain güvencesiyle şeffaf bağışlar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Campaigns Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              🔥 Popüler Kampanyalar
            </h2>
            <p className="text-lg text-slate-600">En çok destek gören projeler</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {popularCampaigns.slice(0, 6).map((campaign: Campaign) => (
              <div key={campaign.id} className="relative">
                <div className="absolute -top-3 -right-3 z-10">
                  <Badge className="gradient-accent text-white animate-pulse">
                    🌟 Popüler
                  </Badge>
                </div>
                <CampaignCard campaign={campaign} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Campaigns Section */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Search and Filter Header */}
            <div className="card-modern p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Kampanya ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                      data-testid="input-search-campaigns"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <select 
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                    >
                      <option value="all">Tümü</option>
                      <option value="popular">Popüler</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <SortDesc className="w-4 h-4 text-slate-500" />
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                    >
                      <option value="recent">En Yeni</option>
                      <option value="donations">En Çok Bağış</option>
                      <option value="supporters">En Çok Destekçi</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-slate-800">
                Tüm Kampanyalar
              </h3>
              <Badge variant="outline" className="text-slate-600">
                {filteredCampaigns.length} kampanya bulundu
              </Badge>
            </div>

            {/* Campaigns Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="campaigns-grid">
                {filteredCampaigns.map((campaign: Campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 modern-blue rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-2">
                  {searchTerm ? "Arama sonucu bulunamadı" : "Henüz kampanya yok"}
                </h3>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">
                  {searchTerm 
                    ? "Farklı anahtar kelimeler deneyerek tekrar arayın"
                    : "İlk kampanyayı bekliyor, belki siz oluşturmak istersiniz?"
                  }
                </p>
                {!searchTerm && (
                  <Button asChild className="gradient-primary text-white btn-modern">
                    <Link href="/funds">
                      Kampanya Oluştur
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="card-modern p-12 gradient-primary text-white">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Siz de Fark Yaratın!
              </h2>
              <p className="text-xl opacity-90">
                Kendi kampanyanızı oluşturun ve hedeflediğiniz değişimi gerçekleştirin
              </p>
              <Button 
                asChild 
                size="lg"
                className="bg-white text-blue-600 hover:bg-slate-100 btn-modern text-lg px-8 py-4"
              >
                <Link href="/funds">
                  <Target className="w-5 h-5 mr-2" />
                  Kampanya Oluştur
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}