import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import WalletConnectButton from "@/components/WalletConnectButton";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Heart, ArrowLeft, Building, Users, Calendar, CheckCircle, Lock } from "lucide-react";

export default function CreateCampaignPage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { isConnected, address } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [campaignType, setCampaignType] = useState<"FUND" | "DONATE">("DONATE");
  const [creatorType, setCreatorType] = useState<"company" | "citizen" | "association" | "foundation">("citizen");

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      targetAmount: "0",
      startDate: "",
      endDate: "",
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data: any) => 
      api.post("/api/create-campaign", {
        ...data,
        campaignType,
        creatorType,
        ownerWallet: address,
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

  const onSubmit = (data: any) => {
    // Validate FUND/DONATE rules
    if (campaignType === "FUND" && creatorType !== "company") {
      toast({
        title: "Hata",
        description: "FUND kampanyaları yalnızca şirketler tarafından oluşturulabilir",
        variant: "destructive",
      });
      return;
    }

    if (campaignType === "DONATE" && creatorType === "company") {
      toast({
        title: "Hata", 
        description: "DONATE kampanyaları şirketler tarafından oluşturulamaz",
        variant: "destructive",
      });
      return;
    }

    if (campaignType === "DONATE" && (!data.startDate || !data.endDate)) {
      toast({
        title: "Hata",
        description: "DONATE kampanyaları için başlangıç ve bitiş tarihi zorunludur",
        variant: "destructive",
      });
      return;
    }

    createCampaignMutation.mutate(data);
  };

  // Update creator type options based on campaign type
  const getCreatorTypeOptions = () => {
    if (campaignType === "FUND") {
      return [{ value: "company", label: "Şirket" }];
    } else {
      return [
        { value: "citizen", label: "Birey" },
        { value: "association", label: "Dernek" },
        { value: "foundation", label: "Vakıf" }
      ];
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-3xl flex items-center justify-center mx-auto">
            <Lock className="w-12 h-12 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-black dark:text-white">Cüzdan Bağlayın</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kampanya oluşturmak için önce cüzdanınızı bağlamanız gerekiyor.
          </p>
          <WalletConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Navigation Header - Binance Style */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-lg border-b border-yellow-200 dark:border-yellow-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-black" />
              </div>
              <span className="text-xl font-bold text-black dark:text-white">DUXXAN</span>
            </div>
            <Link href="/" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Ana Sayfa
            </Link>
          </div>
        </div>
      </header>

      {/* Campaign Creation Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-4">Kampanya Oluştur</h1>
          <p className="text-gray-600 dark:text-gray-400">Hangi tür kampanya oluşturmak istiyorsunuz?</p>
        </div>

        {/* Campaign Type Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* FUND Campaign */}
          <div 
            className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
              campaignType === "FUND" 
                ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20" 
                : "border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-600"
            }`}
            onClick={() => {
              setCampaignType("FUND");
              setCreatorType("company");
            }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <Building className="w-8 h-8 text-yellow-600" />
              <h3 className="text-xl font-bold text-black dark:text-white">FUND Kampanyası</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Şirketler için süresiz fonlama kampanyası
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Yalnızca şirketler oluşturabilir</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Süresiz (kalıcı) kampanya</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Sürekli fonlama imkanı</span>
              </li>
            </ul>
          </div>

          {/* DONATE Campaign */}
          <div 
            className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
              campaignType === "DONATE" 
                ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20" 
                : "border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-600"
            }`}
            onClick={() => {
              setCampaignType("DONATE");
              if (creatorType === "company") setCreatorType("citizen");
            }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-8 h-8 text-yellow-600" />
              <h3 className="text-xl font-bold text-black dark:text-white">DONATE Kampanyası</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Bireyler ve dernekler için süreli bağış kampanyası
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Bireyler, dernekler, vakıflar</span>
              </li>
              <li className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Başlangıç ve bitiş tarihi zorunlu</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Süreli bağış kampanyası</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Campaign Form */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Creator Type Selection */}
              <FormField
                control={form.control}
                name="creatorType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black dark:text-white">Kuruluş Türü</FormLabel>
                    <Select 
                      value={creatorType} 
                      onValueChange={(value: any) => setCreatorType(value)}
                      disabled={campaignType === "FUND"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kuruluş türünü seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getCreatorTypeOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campaign Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black dark:text-white">Kampanya Başlığı</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Kampanyanızın başlığını girin" 
                        {...field} 
                        className="border-gray-300 dark:border-gray-600"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campaign Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black dark:text-white">Kampanya Açıklaması</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Kampanyanızın detaylı açıklaması" 
                        {...field} 
                        className="border-gray-300 dark:border-gray-600 min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campaign Image */}
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black dark:text-white">Kampanya Görseli URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/image.jpg" 
                        {...field} 
                        className="border-gray-300 dark:border-gray-600"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Target Amount */}
              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black dark:text-white">Hedef Tutar (USDT)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        className="border-gray-300 dark:border-gray-600"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Fields - Only for DONATE campaigns */}
              {campaignType === "DONATE" && (
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black dark:text-white">Başlangıç Tarihi</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            className="border-gray-300 dark:border-gray-600"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black dark:text-white">Bitiş Tarihi</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            className="border-gray-300 dark:border-gray-600"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                disabled={createCampaignMutation.isPending}
              >
                {createCampaignMutation.isPending ? "Oluşturuluyor..." : "Kampanya Oluştur"}
              </Button>

            </form>
          </Form>
        </div>

        {/* Campaign Type Info */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold text-black dark:text-white mb-2">
            {campaignType === "FUND" ? "FUND Kampanyası" : "DONATE Kampanyası"} Bilgileri:
          </h3>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            {campaignType === "FUND" ? (
              <>
                <li>• Yalnızca şirketler tarafından oluşturulabilir</li>
                <li>• Süresiz (kalıcı) kampanya - başlangıç/bitiş tarihi yok</li>
                <li>• Sürekli fonlama imkanı</li>
              </>
            ) : (
              <>
                <li>• Bireyler, dernekler ve vakıflar tarafından oluşturulabilir</li>
                <li>• Başlangıç ve bitiş tarihi zorunlu</li>
                <li>• Süreli bağış kampanyası</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}