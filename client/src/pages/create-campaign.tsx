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
import { Badge } from "@/components/ui/badge";
import WalletConnectButton from "@/components/WalletConnectButton";
import NetworkOption from "@/components/NetworkOption";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Heart, ArrowLeft, Plus, Lock, Copy, CheckCircle } from "lucide-react";
import type { z } from "zod";

type CampaignFormData = z.infer<typeof insertCampaignSchema>;

export default function CreateCampaignPage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { isConnected, address } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'bsc' | null>(null);
  const [txHash, setTxHash] = useState("");
  const [accountActive, setAccountActive] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto">
            <Lock className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">{t('funds.connect_wallet')}</h1>
          <p className="text-slate-600">
            {t('funds.connect_wallet')}
          </p>
          <WalletConnectButton />
        </div>
      </div>
    );
  }

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
{t('duxxan')}
              </h1>
            </div>

            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">
{t('common.back_to_home')}
              </Link>
              <Link href="/campaigns" className="text-slate-600 hover:text-slate-800 font-medium transition-colors">
{t('campaigns')}
              </Link>
            </nav>

            <WalletConnectButton />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-8" data-testid="button-back-home">
          <Link href="/">
            <ArrowLeft className="w-5 h-5 mr-2" />
{t('funds.back_home')}
          </Link>
        </Button>

        {/* Account Activation Section */}
        {!accountActive && (
          <div className="bg-gradient-to-br from-pastel-blue to-pastel-purple rounded-3xl p-8 mb-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-blue-200 rounded-3xl flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              
              <h2 className="text-3xl font-bold text-slate-800">
                {t('funds.activation_title')}
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {t('funds.activation_subtitle')}
              </p>
              
              <div className="space-y-6 pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <NetworkOption
                    network="ethereum"
                    name="Ethereum Mainnet"
                    fee={fees?.ethereum ? `${fees.ethereum.amount / Math.pow(10, fees.ethereum.decimals)} ${fees.ethereum.symbol}` : "50 USDT"}
                    color="blue"
                    selected={selectedNetwork === 'ethereum'}
                    onSelect={() => setSelectedNetwork('ethereum')}
                  />
                  <NetworkOption
                    network="bsc"
                    name="BSC Mainnet"
                    fee={fees?.bsc ? `${fees.bsc.amount / Math.pow(10, fees.bsc.decimals)} ${fees.bsc.symbol}` : "25 BUSD"}
                    color="yellow"
                    selected={selectedNetwork === 'bsc'}
                    onSelect={() => setSelectedNetwork('bsc')}
                  />
                </div>
                
                {selectedNetwork && (
                  <div className="bg-white rounded-2xl p-6 space-y-4 max-w-md mx-auto">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">{t('funds.platform_wallet')}</label>
                      <div className="flex items-center space-x-2">
                        <Input 
                          type="text" 
                          value={platformWallet}
                          className="flex-1 font-mono bg-slate-50 text-sm"
                          readOnly
                          data-testid="platform-wallet-address"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(platformWallet)}
                          data-testid="button-copy-platform-wallet"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">{t('funds.tx_hash')}</label>
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
                      onClick={verifyPayment}
                      disabled={!txHash || verifyingPayment}
                      className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                      data-testid="button-verify-payment"
                    >
{verifyingPayment ? t('verifying') : t('funds.verify_payment')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Campaign Creation Form */}
        {accountActive && (
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="text-center space-y-4 mb-10">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-200 to-pink-200 rounded-3xl flex items-center justify-center mx-auto">
                <Plus className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800">{t('funds.campaign_form_title')}</h2>
              <p className="text-slate-600">{t('funds.subtitle')}</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">{t('funds.campaign_title')}</FormLabel>
                      <FormControl>
                        <Input 
placeholder={t('funds.campaign_title')} 
                          className="px-4 py-3 rounded-2xl border-slate-200 focus:border-purple-500 focus:ring-purple-500"
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">{t('funds.campaign_description')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={5}
placeholder={t('funds.campaign_description')} 
                          className="px-4 py-3 rounded-2xl border-slate-200 focus:border-purple-500 focus:ring-purple-500 resize-none"
                          data-testid="textarea-campaign-description"
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
                      <FormLabel className="text-sm font-semibold text-slate-700">{t('funds.campaign_image')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="url"
                          placeholder="https://example.com/image.jpg" 
                          className="px-4 py-3 rounded-2xl border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                          data-testid="input-campaign-image"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-slate-500">{t('funds.campaign_image')}</p>
                    </FormItem>
                  )}
                />
                
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button 
                    type="submit" 
                    disabled={createCampaignMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    data-testid="button-create-campaign"
                  >
{createCampaignMutation.isPending ? "Oluşturuluyor..." : t('funds.create_button')}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {/* Success State */}
        {accountActive && (
          <div className="bg-pastel-green border border-green-200 rounded-2xl p-6 mt-8 flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span className="text-green-800 font-medium">{t('funds.account_activated')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
