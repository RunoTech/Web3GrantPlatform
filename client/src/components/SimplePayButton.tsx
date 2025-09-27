import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/hooks/useWallet";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { erc20Abi } from "viem";
// Modern wallet integration with Wagmi
import { 
  CreditCard, 
  Zap, 
  CheckCircle,
  AlertCircle,
  Loader2 
} from "lucide-react";

interface NetworkFee {
  network: string;
  tokenSymbol: string;
  tokenAddress: string;
  amount: string;
  decimals: number;
}

interface SimplePayButtonProps {
  onPaymentSuccess?: (txHash: string, network: string) => void;
}

// Using standard ERC20 ABI from viem

export default function SimplePayButton({ onPaymentSuccess }: SimplePayButtonProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { isConnected, address } = useWallet();
  const [selectedNetwork, setSelectedNetwork] = useState<string>("ethereum");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: select, 2: processing, 3: success
  
  // Wagmi hooks for contract interaction
  const { writeContract, data: txHash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const { data: fees = [] } = useQuery<NetworkFee[]>({
    queryKey: ["/api/get-fees"],
  });

  const { data: wallets = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/platform-wallets"],
  });

  const selectedFee = fees.find(fee => fee.network === selectedNetwork);
  const platformWallet = wallets[selectedNetwork];

  // Handle transaction confirmation
  React.useEffect(() => {
    if (isConfirmed && txHash) {
      const fee = fees.find(f => f.network === selectedNetwork);
      if (fee) {
        // Auto-activate account with direct activation API
        const activateAccount = async () => {
          try {
            const activationResponse = await fetch("/api/direct-activate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                wallet: address,
                network: selectedNetwork,
                txHash: txHash,
              }),
            });
            
            const activationResult = await activationResponse.json();
            
            if (activationResult.success) {
              setStep(3);
              toast({
                title: "Hesap Aktif Edildi!",
                description: `${fee.amount} ${fee.tokenSymbol} ödeme başarılı`,
              });
              
              onPaymentSuccess?.(txHash, selectedNetwork);
            } else {
              throw new Error(activationResult.error || "Aktivasyon başarısız");
            }
          } catch (activationError) {
            console.error("Activation error:", activationError);
            // Still show success for payment but indicate activation issue
            setStep(3);
            toast({
              title: "Ödeme Tamamlandı",
              description: "Aktivasyon işlemi için lütfen sayfayı yenileyin",
              variant: "destructive"
            });
            
            onPaymentSuccess?.(txHash, selectedNetwork);
          } finally {
            setIsProcessing(false);
          }
        };
        
        activateAccount();
      }
    }
  }, [isConfirmed, txHash, fees, selectedNetwork, address, onPaymentSuccess, toast]);

  // Handle write errors
  React.useEffect(() => {
    if (writeError) {
      console.error("Write error:", writeError);
      let errorMessage = "İşlem başarısız";
      
      if (writeError.message?.includes('User rejected')) {
        errorMessage = "İşlem kullanıcı tarafından iptal edildi";
      } else if (writeError.message?.includes('insufficient')) {
        errorMessage = "Gas ücreti için yetersiz bakiye";
      }
      
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      });
      setStep(1);
      setIsProcessing(false);
    }
  }, [writeError, toast]);

  const handlePayment = async (network: string) => {
    if (!isConnected || !address) {
      toast({
        title: "Cüzdan Bağlantısı Gerekli",
        description: "Önce cüzdanınızı bağlayın",
        variant: "destructive",
      });
      return;
    }

    const fee = fees.find(f => f.network === network);
    const wallet = wallets[network];
    
    if (!fee || !wallet) {
      toast({
        title: "Hata",
        description: "Ağ bilgileri yüklenemedi",
        variant: "destructive",
      });
      return;
    }

    setSelectedNetwork(network);
    setIsProcessing(true);
    setStep(2);

    try {
      // Convert amount to contract units
      const requiredAmount = parseUnits(fee.amount, fee.decimals);
      
      // Execute transfer using Wagmi
      await writeContract({
        address: fee.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [wallet as `0x${string}`, requiredAmount],
      });

    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Hata",
        description: error.message || "İşlem başarısız",
        variant: "destructive",
      });
      setStep(1);
      setIsProcessing(false);
    }
  };

  // Step 1: Network Selection
  if (step === 1) {
    return (
      <Card className="card-standard p-8 max-w-2xl mx-auto">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 btn-binance rounded-full flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8 text-background" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              HESAP AKTİVASYONU
            </h2>
            <p className="text-muted-foreground">
              Kampanya oluşturmak için tek seferlik aktivasyon ücreti ödeyin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fees.map((fee) => (
              <button
                key={fee.network}
                onClick={() => handlePayment(fee.network)}
                disabled={!isConnected}
                className="card-standard p-6 hover:border-primary transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid={`pay-${fee.network}`}
              >
                <div className="space-y-4">
                  <Badge 
                    variant="outline" 
                    className={`${fee.network === 'ethereum' ? 'border-blue-500 text-blue-500' : 'border-yellow-500 text-yellow-500'} mb-2`}
                  >
                    {fee.network === 'ethereum' ? 'ETHEREUM' : 'BSC'}
                  </Badge>
                  
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-primary">
                      {fee.amount} {fee.tokenSymbol}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Aktivasyon Ücreti
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-green-500">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm font-semibold">OTOMATİK ÖDEME</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {!isConnected && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Önce cüzdanınızı bağlayın</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Step 2: Processing
  if (step === 2) {
    return (
      <Card className="card-standard p-8 max-w-md mx-auto text-center">
        <div className="space-y-6">
          <div className="w-16 h-16 bg-primary/20 border border-primary rounded-full flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-2">
              İŞLEM YAPILIYOR
            </h3>
            <p className="text-muted-foreground mb-4">
              MetaMask'ta işleminizi onaylayın
            </p>
            
            {selectedFee && (
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Ödeme Miktarı:</div>
                <div className="text-lg font-bold text-primary">
                  {selectedFee.amount} {selectedFee.tokenSymbol}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Step 3: Success
  if (step === 3) {
    return (
      <Card className="card-standard p-8 max-w-md mx-auto text-center border-green-500">
        <div className="space-y-6">
          <div className="w-16 h-16 bg-green-500/20 border border-green-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-2 text-green-500">
              ÖDEME BAŞARILI!
            </h3>
            <p className="text-muted-foreground">
              Hesabınız aktive edildi. Artık kampanya oluşturabilirsiniz.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}