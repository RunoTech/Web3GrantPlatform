import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WalletConnectButton from "@/components/WalletConnectButton";
import Header from "@/components/Header";
import { Heart, ArrowLeft, ExternalLink, Users, Target, Activity, CheckCircle, Clock, Building, TrendingUp, Shield, Zap } from "lucide-react";
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

      {/* Campaign Hero Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Campaign Header Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="relative">
              {/* Header Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600"></div>
              <div className="absolute inset-0 bg-black/20"></div>
              
              {/* Header Content */}
              <div className="relative z-10 px-8 py-12 text-white">
                <div className="max-w-4xl">
                  {/* Status Badges */}
                  <div className="flex items-center gap-3 mb-6">
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 transition-all" data-testid="campaign-status">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Aktif
                    </Badge>
                    {campaign.featured && (
                      <Badge className="bg-yellow-500/90 text-white border-yellow-400/30">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Öne Çıkan
                      </Badge>
                    )}
                    {campaign.campaignType === 'FUND' && (
                      <Badge className="bg-purple-500/90 text-white border-purple-400/30">
                        <Building className="w-3 h-3 mr-1" />
                        Kurumsal Fon
                      </Badge>
                    )}
                  </div>
                  
                  {/* Real-time Monitoring Status */}
                  <div className="flex items-center gap-3 mb-8 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20" data-testid="status-monitoring">
                    <div className="relative">
                      <Shield className="w-6 h-6 text-green-300" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg">Blockchain Güvenlik Aktif</p>
                      <p className="text-blue-100 text-sm">Ethereum Mainnet • USDT transferleri gerçek zamanlı izleniyor</p>
                    </div>
                  </div>
                  
                  <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight" data-testid="campaign-title">
                    {campaign.title}
                  </h1>
                  <p className="text-xl text-blue-100 leading-relaxed max-w-3xl" data-testid="campaign-description">
                    {campaign.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Campaign Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Column - Campaign Image & Stats */}
            <div className="lg:col-span-2 space-y-8">
              {/* Campaign Visual */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
                <img 
                  src={campaign.imageUrl} 
                  alt={campaign.title}
                  className="w-full h-80 object-cover"
                  data-testid="campaign-image"
                />
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Total Amount Stat */}
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="flex items-center justify-center mb-3">
                        <div className="p-3 bg-green-100 rounded-full">
                          <Target className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                      <p className="text-sm font-medium text-green-700 mb-1">Toplanan Miktar</p>
                      <p className="text-3xl font-bold text-green-900" data-testid="total-donations">
                        {parseFloat(campaign.totalDonations).toLocaleString()} USDT
                      </p>
                      {campaign.targetAmount && (
                        <p className="text-xs text-green-600 mt-2">
                          Hedef: {parseFloat(campaign.targetAmount).toLocaleString()} USDT
                        </p>
                      )}
                    </div>
                    
                    {/* Supporters Stat */}
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-center mb-3">
                        <div className="p-3 bg-blue-100 rounded-full">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <p className="text-sm font-medium text-blue-700 mb-1">
                        {campaign.campaignType === 'FUND' ? 'Yatırımcı' : 'Destekçi'}
                      </p>
                      <p className="text-3xl font-bold text-blue-900" data-testid="donation-count">
                        {campaign.donationCount}
                      </p>
                      <p className="text-xs text-blue-600 mt-2">Aktif katılımcı</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Owner Information */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6">
                  {campaign.campaignType === 'FUND' ? 'Şirket Bilgileri' : 'Kampanya Sahibi'}
                </h3>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full">
                    {campaign.campaignType === 'FUND' ? (
                      <Building className="w-6 h-6 text-white" />
                    ) : (
                      <Heart className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Blockchain Adresi</p>
                    <span className="font-mono text-lg text-slate-800" data-testid="owner-wallet">
                      {campaign.ownerWallet.slice(0, 8)}...{campaign.ownerWallet.slice(-6)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column - Donation Form & Process */}
            <div className="lg:col-span-1 space-y-8">
              {/* Enhanced Donation Form */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sticky top-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border border-green-200">
                    <Zap className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">
                      {campaign.campaignType === 'FUND' ? 'Yatırım Yap' : 'Destek Ol'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mt-4 mb-2">
                    {campaign.campaignType === 'FUND' ? 'Bu Projeye Yatırım Yapın' : 'Bu Kampanyayı Destekleyin'}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {campaign.campaignType === 'FUND' 
                      ? 'Güvenli blockchain teknolojisi ile direkt yatırım yapın'
                      : 'Güvenli blockchain teknolojisi ile direkt bağış yapın'
                    }
                  </p>
                </div>
                
                <DonationForm
                  campaignId={campaign.id}
                  ownerWallet={campaign.ownerWallet}
                  campaignTitle={campaign.title}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/campaign", id] });
                  }}
                />
                
                {/* Professional Process Steps */}
                <div className="mt-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                  <h4 className="text-lg font-bold text-slate-800 mb-4 text-center">İşlem Süreci</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">1</div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">Cüzdan Bağlantısı</p>
                        <p className="text-xs text-slate-600">MetaMask veya desteklenen cüzdanınızı güvenle bağlayın</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">2</div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">Miktar Belirleme</p>
                        <p className="text-xs text-slate-600">USDT miktarını girin ve blockchain işlemini onaylayın</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">3</div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">Otomatik Kayıt</p>
                        <p className="text-xs text-slate-600">İşleminiz onaylandıktan sonra otomatik olarak sisteme kaydedilir</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Security Notice */}
                  <div className="mt-6 p-4 bg-white/80 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-800">Güvenlik Garantisi</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      Tüm işlemler Ethereum blockchain üzerinde şeffaf ve güvenli şekilde gerçekleştirilir. Fonlar doğrudan kampanya sahibine transfer edilir.
                    </p>
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
