import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCampaignSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Header from "@/components/Header";
import NetworkOption from "@/components/NetworkOption";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  ArrowLeft, 
  Plus, 
  Lock, 
  Copy, 
  CheckCircle,
  Target,
  Rocket,
  Shield,
  Zap,
  DollarSign,
  Users,
  Wallet as WalletIcon
} from "lucide-react";
import type { z } from "zod";

type CampaignFormData = z.infer<typeof insertCampaignSchema>;

export default function FundsPage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { isConnected, address } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'bsc' | null>(null);
  const [txHash, setTxHash] = useState("");
  const [accountActive, setAccountActive] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [activationStep, setActivationStep] = useState(1);

  const { data: fees } = useQuery({
    queryKey: ["/api/fees"],
    enabled: isConnected,
  });

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(insertCampaignSchema.omit({ ownerWallet: true })),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data: CampaignFormData) => 
      api.post("/api/create-campaign", data, { 
        headers: { wallet: address } 
      }),
    onSuccess: (data) => {
      toast({
        title: "Başarılı!",
        description: "Kampanyanız başarıyla oluşturuldu",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/get-campaigns"] });
      setLocation(`/campaign/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kampanya oluşturulamadı",
        variant: "destructive",
      });
    },
  });

  const verifyPayment = async () => {
    if (!selectedNetwork || !txHash || !address) return;
    
    setVerifyingPayment(true);
    try {
      await api.post("/api/verify-payment", {
        network: selectedNetwork,
        wallet: address,
        txHash,
      });
      
      setAccountActive(true);
      setActivationStep(4);
      toast({
        title: "Başarılı!",
        description: "Hesabınız başarıyla aktifleştirildi",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Ödeme doğrulanamadı",
        variant: "destructive",
      });
    } finally {
      setVerifyingPayment(false);
    }
  };

  const onSubmit = (data: CampaignFormData) => {
    createCampaignMutation.mutate({
      ...data,
      ownerWallet: address!,
    });
  };

  const platformWallet = selectedNetwork === 'ethereum' 
    ? "0x742d35Cc9000C1b4c5aB2dBD3E47A5C6BADE3A7F"
    : "0x8A2d5B7A9B2F3C1D4E5F6A7B8C9D0E1F2A3B4C5D";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopyalandı!",
      description: "Adres panoya kopyalandı",
    });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-8 max-w-md mx-auto p-8">
          <div className="w-32 h-32 gradient-primary rounded-lg flex items-center justify-center mx-auto neon-border">
            <WalletIcon className="w-16 h-16 text-background" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground uppercase tracking-wider">{t('funds.title')}</h1>
            <p className="text-lg text-muted-foreground">
              {t('funds.connect_wallet')}
            </p>
          </div>
          <div className="btn-cyber p-4">
            <WalletConnectButton />
          </div>
          <Button variant="ghost" asChild className="mt-6">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('funds.back_home')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header currentPage="funds" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-8" data-testid="button-back-home">
          <Link href="/">
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('funds.back_home')}
          </Link>
        </Button>

        {/* Progress Steps */}
        <div className="cyber-card p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                activationStep >= 1 ? 'gradient-primary text-background' : 'bg-surface-2 text-muted-foreground'
              }`}>
                <WalletIcon className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <p className="font-semibold text-foreground uppercase tracking-wide">{t('funds.steps.wallet_connection')}</p>
                <p className="text-sm text-muted-foreground">{t('funds.steps.connect_wallet')}</p>
              </div>
            </div>
            
            <div className="h-0.5 flex-1 mx-4 bg-slate-200 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-500 ${
                activationStep >= 2 ? 'gradient-primary w-1/3' : 'bg-slate-200 w-0'
              }`}></div>
            </div>

            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                activationStep >= 2 ? 'gradient-primary text-white' : 'bg-slate-200 text-slate-400'
              }`}>
                <Shield className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <p className="font-semibold text-slate-800">Hesap Aktivasyonu</p>
                <p className="text-sm text-slate-600">Aktivasyon ücreti ödeyin</p>
              </div>
            </div>

            <div className="h-0.5 flex-1 mx-4 bg-slate-200 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-500 ${
                activationStep >= 3 ? 'gradient-primary w-2/3' : 'bg-slate-200 w-0'
              }`}></div>
            </div>

            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                activationStep >= 4 ? 'gradient-primary text-white' : 'bg-slate-200 text-slate-400'
              }`}>
                <Rocket className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <p className="font-semibold text-slate-800">Kampanya Oluştur</p>
                <p className="text-sm text-slate-600">Projenizi başlatın</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Activation Section */}
        {!accountActive && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-6 card-modern p-12">
              <div className="w-24 h-24 gradient-primary rounded-3xl flex items-center justify-center mx-auto animate-glow">
                <Target className="w-12 h-12 text-white" />
              </div>
              
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
                  Fon Toplama <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Merkezi</span>
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                  Projenizi hayata geçirmek için güvenli ve şeffaf fon toplama platformuna hoş geldiniz
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card-modern p-6 text-center">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Güvenli Platform</h3>
                <p className="text-slate-600 text-sm">Blockchain teknolojisi ile güvenli işlemler</p>
              </div>
              
              <div className="card-modern p-6 text-center">
                <div className="w-16 h-16 gradient-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Hızlı Başlangıç</h3>
                <p className="text-slate-600 text-sm">Dakikalar içinde kampanyanızı oluşturun</p>
              </div>
              
              <div className="card-modern p-6 text-center">
                <div className="w-16 h-16 gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Komisyonsuz</h3>
                <p className="text-slate-600 text-sm">Bağışlar doğrudan size ulaşır</p>
              </div>
            </div>

            {/* Activation Panel */}
            <div className="card-modern p-8">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 modern-orange rounded-3xl flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8 text-orange-600" />
                </div>
                
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">
                    Hesap Aktivasyonu
                  </h2>
                  <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Kampanya oluşturmak için hesabınızı aktive edin. Sadece bir kerelik ücret ile platform kullanımına başlayın.
                  </p>
                </div>
                
                <div className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <NetworkOption
                      network="ethereum"
                      name="Ethereum Mainnet"
                      fee={fees?.ethereum ? `${fees.ethereum.amount / Math.pow(10, fees.ethereum.decimals)} ${fees.ethereum.symbol}` : "50 USDT"}
                      color="blue"
                      selected={selectedNetwork === 'ethereum'}
                      onSelect={() => {
                        setSelectedNetwork('ethereum');
                        setActivationStep(2);
                      }}
                    />
                    <NetworkOption
                      network="bsc"
                      name="BSC Mainnet"
                      fee={fees?.bsc ? `${fees.bsc.amount / Math.pow(10, fees.bsc.decimals)} ${fees.bsc.symbol}` : "25 BUSD"}
                      color="yellow"
                      selected={selectedNetwork === 'bsc'}
                      onSelect={() => {
                        setSelectedNetwork('bsc');
                        setActivationStep(2);
                      }}
                    />
                  </div>
                  
                  {selectedNetwork && (
                    <div className="max-w-md mx-auto space-y-6">
                      <div className="card-modern p-6 space-y-4">
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">
                            1. Platform Cüzdan Adresine Ödeme Yapın
                          </label>
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="text" 
                              value={platformWallet}
                              className="flex-1 font-mono bg-slate-50 text-sm"
                              readOnly
                              data-testid="platform-wallet-address"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(platformWallet)}
                              data-testid="button-copy-platform-wallet"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">
                            2. İşlem Hash'ini (TX Hash) Girin
                          </label>
                          <Input 
                            type="text" 
                            placeholder="0x..." 
                            value={txHash}
                            onChange={(e) => setTxHash(e.target.value)}
                            className="font-mono text-sm"
                            data-testid="input-tx-hash"
                          />
                        </div>
                        
                        <Button 
                          onClick={() => {
                            setActivationStep(3);
                            verifyPayment();
                          }}
                          disabled={!txHash || verifyingPayment}
                          className="w-full gradient-primary text-white btn-modern"
                          data-testid="button-verify-payment"
                        >
                          {verifyingPayment ? "Doğrulanıyor..." : "3. Ödemeyi Doğrula"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {accountActive && !createCampaignMutation.data && (
          <div className="card-modern p-8 mb-8 text-center gradient-secondary text-white">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Tebrikler! 🎉</h2>
            <p className="text-lg opacity-90">
              Hesabınız başarıyla aktifleştirildi. Artık kampanya oluşturabilirsiniz.
            </p>
          </div>
        )}

        {/* Campaign Creation Form */}
        {accountActive && (
          <div className="card-modern p-8">
            <div className="text-center space-y-6 mb-10">
              <div className="w-20 h-20 gradient-accent rounded-3xl flex items-center justify-center mx-auto animate-glow">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Yeni Kampanya Oluştur</h2>
                <p className="text-lg text-slate-600">Projenizi tanıtın ve hedeflediğiniz desteği toplayın</p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-slate-700">
                            Kampanya Başlığı *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Projenizin etkileyici başlığını yazın" 
                              className="px-4 py-3 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-base"
                              data-testid="input-campaign-title"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-slate-700">
                            Kampanya Görseli *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="url"
                              placeholder="https://example.com/image.jpg" 
                              className="px-4 py-3 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-base"
                              data-testid="input-campaign-image"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-slate-500">
                            Projenizi en iyi temsil eden yüksek kaliteli bir görsel URL'si
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-slate-700">
                            Kampanya Açıklaması *
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              rows={8}
                              placeholder="Projenizi detaylı bir şekilde açıklayın. Hedeflerinizi, planlarınızı ve neden desteklenmesi gerektiğini anlatın..." 
                              className="px-4 py-3 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 resize-none text-base"
                              data-testid="textarea-campaign-description"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-slate-500">
                            Destekçilerinizi ikna edecek kapsamlı bir açıklama yazın
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="border-t pt-8">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      type="button"
                      variant="outline"
                      size="lg"
                      asChild
                      className="btn-modern"
                    >
                      <Link href="/donations">
                        Önce Diğer Kampanyaları Gör
                      </Link>
                    </Button>
                    
                    <Button 
                      type="submit" 
                      disabled={createCampaignMutation.isPending}
                      size="lg"
                      className="gradient-primary text-white btn-modern px-12"
                      data-testid="button-create-campaign"
                    >
                      {createCampaignMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Oluşturuluyor...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-5 h-5 mr-2" />
                          Kampanyayı Başlat
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}