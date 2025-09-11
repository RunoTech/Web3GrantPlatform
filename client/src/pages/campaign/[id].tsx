import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WalletConnectButton from "@/components/WalletConnectButton";
import Header from "@/components/Header";
import { Heart, ArrowLeft, ExternalLink, Users, Target, Activity, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DonationForm from "@/components/DonationForm";
import type { Campaign } from "@shared/schema";

export default function CampaignDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["/api/campaign", id],
  });


  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600">Kampanya yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-800">Kampanya bulunamadı</h1>
          <Button asChild>
            <Link href="/campaigns">Kampanyalara Dön</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header currentPage="campaigns" />

      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Button variant="ghost" asChild data-testid="button-back-campaigns">
          <Link href="/campaigns">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Kampanyalara Dön
          </Link>
        </Button>
      </div>

      {/* Campaign Detail */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl overflow-hidden shadow-lg">
            <div className="md:flex">
              {/* Campaign Image */}
              <div className="md:w-1/2">
                <img 
                  src={campaign.imageUrl} 
                  alt={campaign.title}
                  className="w-full h-72 md:h-full object-cover"
                  data-testid="campaign-image"
                />
              </div>
              
              {/* Campaign Details */}
              <div className="md:w-1/2 p-8 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-pastel-green text-green-800" data-testid="campaign-status">
                      Aktif
                    </Badge>
                    {campaign.featured && (
                      <Badge className="bg-pastel-orange text-orange-800">
                        Öne Çıkan
                      </Badge>
                    )}
                  </div>
                  
                  {/* Real-time Monitoring Status Badge */}
                  <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200" data-testid="status-monitoring">
                    <div className="relative">
                      <Activity className="w-5 h-5 text-green-600" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-800">Otomatik Algılama Aktif</p>
                      <p className="text-xs text-green-600">Ethereum • USDT bağışları anlık izleniyor</p>
                    </div>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-800" data-testid="campaign-title">
                    {campaign.title}
                  </h1>
                  <p className="text-slate-600 leading-relaxed" data-testid="campaign-description">
                    {campaign.description}
                  </p>
                </div>
                
                {/* Campaign Stats */}
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="text-center p-4 bg-white rounded-2xl">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Target className="w-5 h-5 text-slate-500" />
                      <p className="text-sm text-slate-500">Toplanan</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-800" data-testid="total-donations">
                      {campaign.totalDonations} USDT
                    </p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-2xl">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Users className="w-5 h-5 text-slate-500" />
                      <p className="text-sm text-slate-500">Destekçi</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-800" data-testid="donation-count">
                      {campaign.donationCount}
                    </p>
                  </div>
                </div>
                
                {/* Owner Info */}
                <div className="bg-white rounded-2xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Kampanya Sahibi</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                    <span className="font-mono text-sm text-slate-600" data-testid="owner-wallet">
                      {campaign.ownerWallet.slice(0, 6)}...{campaign.ownerWallet.slice(-4)}
                    </span>
                  </div>
                </div>
                
                {/* Direct Donation Form */}
                <DonationForm
                  campaignId={campaign.id}
                  ownerWallet={campaign.ownerWallet}
                  campaignTitle={campaign.title}
                  onSuccess={() => {
                    // Invalidate campaign query cache to refresh data
                    queryClient.invalidateQueries({ queryKey: ["/api/campaign", id] });
                  }}
                />
                
                {/* How It Works Info */}
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Nasıl Çalışır?</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                      <p className="text-xs text-slate-600">Cüzdanınızı bağlayın ve miktarı girin</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                      <p className="text-xs text-slate-600">USDT transferini onaylayın</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                      <p className="text-xs text-slate-600">Bağışınız otomatik kaydedilir ve toplamlar güncellenir</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
