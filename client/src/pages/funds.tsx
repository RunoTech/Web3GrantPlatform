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
import WalletConnectButton from "@/components/WalletConnectButton";
import NetworkOption from "@/components/NetworkOption";
import SimplePayButton from "@/components/SimplePayButton";
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
        headers: { wallet: address || "" } 
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
      title: t('common.copied'),
      description: t('common.copied'),
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
                <p className="font-semibold text-slate-800">{t('funds.steps.account_activation')}</p>
                <p className="text-sm text-slate-600">{t('funds.steps.pay_activation')}</p>
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
                <p className="font-semibold text-slate-800">{t('funds.steps.create_campaign')}</p>
                <p className="text-sm text-slate-600">{t('funds.steps.prepare_campaign')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Account Activation */}
        {!accountActive && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-6 cyber-card p-8">
              <div className="w-20 h-20 gradient-primary rounded-lg flex items-center justify-center mx-auto neon-border">
                <Target className="w-10 h-10 text-background" />
              </div>
              
              <div>
                <h1 className="text-3xl md:text-4xl font-bold neon-text mb-4 uppercase tracking-wide">
                  {t('funds.title')}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {t('funds.subtitle')}
                </p>
              </div>
            </div>

            <SimplePayButton 
              onPaymentSuccess={(txHash, network) => {
                setAccountActive(true);
                setActivationStep(4);
                toast({
                  title: t('funds.account_activated'),
                  description: `${network} ağında ödemeniz onaylandı`,
                });
              }}
            />
          </div>
        )}

        {/* Success Message */}
        {accountActive && !createCampaignMutation.data && (
          <div className="card-modern p-8 mb-8 text-center gradient-secondary text-white">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t('funds.payment_success')}</h2>
            <p className="text-lg opacity-90">
              {t('funds.account_activated')}
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
                <h2 className="text-3xl font-bold text-slate-800 mb-2">{t('funds.campaign_form_title')}</h2>
                <p className="text-lg text-slate-600">{t('funds.campaign_subtitle')}</p>
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
                            {t('funds.campaign_title')} *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t('funds.campaign_title_placeholder')} 
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
                            {t('funds.campaign_image')} *
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
                            {t('funds.image_description')}
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
                            {t('funds.campaign_description')} *
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              rows={8}
                              placeholder={t('funds.description_placeholder')} 
                              className="px-4 py-3 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 resize-none text-base"
                              data-testid="textarea-campaign-description"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-slate-500">
                            {t('funds.description_help')}
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
                        {t('funds.view_other_campaigns')}
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
                          {t('funds.creating')}...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-5 h-5 mr-2" />
                          {t('funds.create_button')}
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