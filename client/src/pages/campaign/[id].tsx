import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WalletConnectButton from "@/components/WalletConnectButton";
import Header from "@/components/Header";
import ShareButton from "@/components/ShareButton";
import { Heart, ArrowLeft, ExternalLink, Users, Target, Activity, CheckCircle, Clock, Building, TrendingUp, Shield, Zap, CreditCard, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DonationForm from "@/components/DonationForm";
import { generateCampaignShareLink } from "@/utils/share";
import type { Campaign } from "@shared/schema";

export default function CampaignDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["/api/campaign", id],
  });


  if (isLoading) {
    return (
      <div className="min-h-screen surface-primary flex items-center justify-center">
        <div className="text-center space-4">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto animate-pulse shadow-binance">
            <Heart className="w-8 h-8 icon-on-primary" />
          </div>
          <p className="text-muted-foreground">Kampanya yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen surface-primary flex items-center justify-center">
        <div className="text-center space-4">
          <h1 className="text-2xl font-bold text-foreground">Kampanya bulunamadı</h1>
          <Button asChild className="btn-binance btn-lg" data-testid="button-back-from-error">
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
      <div className="container-main pt-6">
        <Button variant="ghost" asChild data-testid="button-back-campaigns" className="btn-secondary btn-md">
          <Link href="/campaigns">
            <ArrowLeft className="w-5 h-5 mr-2 icon-visible" />
            Kampanyalara Dön
          </Link>
        </Button>
      </div>

      {/* Campaign Hero Section */}
      <section className="section-spacing">
        <div className="container-main">
          {/* Campaign Header Card */}
          <div className="card-standard">
            <div className="bg-primary text-primary-foreground rounded-xl p-8 mb-6 shadow-binance">
              {/* Header Content */}
              <div className="space-6">
                <div className="max-w-4xl">
                {/* Status Badges and Share Button */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-3">
                    <Badge className="bg-background/20 text-primary-foreground border-background/30" data-testid="campaign-status">
                      <CheckCircle className="w-3 h-3 mr-1 icon-on-primary" />
                      Aktif
                    </Badge>
                    {campaign.featured && (
                      <Badge className="bg-background/20 text-primary-foreground border-background/30" data-testid="badge-featured">
                        <TrendingUp className="w-3 h-3 mr-1 icon-on-primary" />
                        Öne Çıkan
                      </Badge>
                    )}
                    {campaign.campaignType === 'FUND' && (
                      <Badge className="bg-background/20 text-primary-foreground border-background/30" data-testid="badge-fund">
                        <Building className="w-3 h-3 mr-1 icon-on-primary" />
                        Kurumsal Fon
                      </Badge>
                    )}
                  </div>
                  {/* Share Button */}
                  <ShareButton 
                    shareData={generateCampaignShareLink(campaign.id, campaign.title)}
                    variant="outline"
                    className="bg-background/20 text-primary-foreground border-background/30 hover:bg-background/30"
                    data-testid="button-share-campaign"
                  />
                </div>
                  
                {/* Real-time Monitoring Status */}
                <div className="flex items-center space-4 mb-8 p-4 bg-background/10 rounded-xl border border-background/20" data-testid="status-monitoring">
                  <div className="relative">
                    <Shield className="w-6 h-6 icon-on-primary" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-background rounded-full animate-pulse shadow-lg"></div>
                  </div>
                  <div>
                    <p className="text-primary-foreground font-semibold text-lg">Blockchain Güvenlik Aktif</p>
                    <p className="text-primary-foreground/80 text-sm">Ethereum Mainnet • USDT transferleri gerçek zamanlı izleniyor</p>
                  </div>
                </div>
                  
                <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight text-primary-foreground" data-testid="campaign-title">
                  {campaign.title}
                </h1>
                <p className="text-xl text-primary-foreground/90 leading-relaxed max-w-3xl" data-testid="campaign-description">
                  {campaign.description}
                </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Campaign Content */}
      <section className="section-spacing">
        <div className="container-main">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Column - Campaign Image & Stats */}
            <div className="lg:col-span-2 space-y-8">
              {/* Campaign Visual */}
              <div className="card-standard overflow-hidden">
                <img 
                  src={campaign.imageUrl} 
                  alt={campaign.title}
                  className="w-full h-80 object-cover"
                  data-testid="campaign-image"
                />
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Total Amount Stat */}
                    <div className="text-center p-6 surface-secondary rounded-xl border border-border" data-testid="stat-total-amount">
                      <div className="flex items-center justify-center mb-3">
                        <div className="p-3 bg-primary/10 rounded-full">
                          <Target className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Toplanan Miktar</p>
                      <p className="text-3xl font-bold text-foreground" data-testid="total-donations">
                        {parseFloat(campaign.totalDonations).toLocaleString()} USDT
                      </p>
                      {campaign.targetAmount && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Hedef: {parseFloat(campaign.targetAmount).toLocaleString()} USDT
                        </p>
                      )}
                    </div>
                    
                    {/* Supporters Stat */}
                    <div className="text-center p-6 surface-secondary rounded-xl border border-border" data-testid="stat-supporters">
                      <div className="flex items-center justify-center mb-3">
                        <div className="p-3 bg-primary/10 rounded-full">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {campaign.campaignType === 'FUND' ? 'Yatırımcı' : 'Destekçi'}
                      </p>
                      <p className="text-3xl font-bold text-foreground" data-testid="donation-count">
                        {campaign.donationCount}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Aktif katılımcı</p>
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
              <div className="card-standard shadow-lg sticky top-8" data-testid="donation-form-section">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center space-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">
                      {campaign.campaignType === 'FUND' ? 'Yatırım Yap' : 'Destek Ol'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mt-4 mb-2" data-testid="form-title">
                    {campaign.campaignType === 'FUND' ? 'Bu Projeye Yatırım Yapın' : 'Bu Kampanyayı Destekleyin'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
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
                
                {/* Virtual POS Credit Card Payment Option */}
                {campaign.creditCardEnabled && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                    <div className="text-center">
                      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-800 rounded-full border border-blue-300 dark:border-blue-600 mb-4">
                        <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                          Virtual POS
                        </span>
                      </div>
                      <h4 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                        Kredi Kartıyla Öde
                      </h4>
                      <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                        Visa, Mastercard, American Express ve diğer kredi kartlarını kabul ediyoruz
                      </p>
                      <Button 
                        asChild
                        className="btn-primary w-full font-semibold"
                        data-testid="button-virtual-pos"
                      >
                        <Link href={`/virtual-pos?campaignId=${campaign.id}`}>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Kredi Kartıyla Öde
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                      <div className="mt-3 flex items-center justify-center space-x-2">
                        <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          3D Secure doğrulama ile güvenli ödeme
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Professional Process Steps */}
                <div className="mt-8 p-6 surface-secondary rounded-xl border border-border" data-testid="process-steps">
                  <h4 className="text-lg font-bold text-foreground mb-4 text-center">İşlem Süreci</h4>
                  <div className="space-6">
                    <div className="flex items-start space-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold shadow-binance">1</div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Cüzdan Bağlantısı</p>
                        <p className="text-xs text-muted-foreground">MetaMask veya desteklenen cüzdanınızı güvenle bağlayın</p>
                      </div>
                    </div>
                    <div className="flex items-start space-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold shadow-binance">2</div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Miktar Belirleme</p>
                        <p className="text-xs text-muted-foreground">USDT miktarını girin ve blockchain işlemini onaylayın</p>
                      </div>
                    </div>
                    <div className="flex items-start space-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold shadow-binance">3</div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Otomatik Kayıt</p>
                        <p className="text-xs text-muted-foreground">İşleminiz onaylandıktan sonra otomatik olarak sisteme kaydedilir</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Security Notice */}
                  <div className="mt-6 p-4 surface-card rounded-lg border border-border" data-testid="security-notice">
                    <div className="flex items-center space-2 mb-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Güvenlik Garantisi</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
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
