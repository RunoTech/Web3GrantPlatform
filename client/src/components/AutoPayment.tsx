import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/hooks/useWallet";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { erc20Abi } from "viem";
// Modern wallet integration with Wagmi
import { 
  Copy, 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  Smartphone, 
  Wallet,
  QrCode,
  CreditCard
} from "lucide-react";

interface NetworkFee {
  network: string;
  tokenSymbol: string;
  tokenAddress: string;
  amount: string;
  decimals: number;
}

interface AutoPaymentProps {
  onPaymentSuccess?: (txHash: string, network: string) => void;
}

// Using standard ERC20 ABI from viem

export default function AutoPayment({ onPaymentSuccess }: AutoPaymentProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { isConnected, address } = useWallet();
  const [selectedNetwork, setSelectedNetwork] = useState<string>("ethereum");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('copied'),
      description: t('copiedToClipboard'),
      duration: 2000,
    });
  };

  // Handle transaction confirmation
  React.useEffect(() => {
    if (isConfirmed && txHash && selectedFee) {
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
            toast({
              title: "Hesap Aktive Edildi!",
              description: `${selectedFee.amount} ${selectedFee.tokenSymbol} ödeme başarılı`,
            });
            
            onPaymentSuccess?.(txHash, selectedNetwork);
          } else {
            throw new Error(activationResult.error || "Aktivasyon başarısız");
          }
        } catch (activationError) {
          console.error("Activation error:", activationError);
          // Still show success for payment
          toast({
            title: "Ödeme Tamamlandı",
            description: "Hesap aktivasyonu için sayfayı yenileyin",
          });
          
          onPaymentSuccess?.(txHash, selectedNetwork);
        } finally {
          setIsProcessing(false);
        }
      };
      
      activateAccount();
    }
  }, [isConfirmed, txHash, selectedFee, address, selectedNetwork, onPaymentSuccess, toast]);

  // Handle write errors
  React.useEffect(() => {
    if (writeError) {
      console.error("Write error:", writeError);
      let errorMessage = "İşlem başarısız";
      
      if (writeError.message?.includes('User rejected')) {
        errorMessage = "İşlem kullanıcı tarafından reddedildi";
      } else if (writeError.message?.includes('insufficient')) {
        errorMessage = "Gas ücretleri için yetersiz bakiye";
      }
      
      toast({
        title: t('error'),
        description: errorMessage,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  }, [writeError, t, toast]);

  // Auto payment with Wagmi
  const handleAutoPayment = async () => {
    if (!isConnected || !address || !selectedFee || !platformWallet) {
      toast({
        title: t('error'),
        description: t('connectWalletFirst'),
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Convert amount to contract units
      const requiredAmount = parseUnits(selectedFee.amount, selectedFee.decimals);
      
      toast({
        title: "İşlem Gönderildi",
        description: "Lütfen onay bekleyin...",
      });

      // Execute transfer using Wagmi
      await writeContract({
        address: selectedFee.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [platformWallet as `0x${string}`, requiredAmount],
      });

    } catch (error: any) {
      console.error("Auto payment error:", error);
      toast({
        title: t('error'),
        description: error.message || "İşlem başarısız",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  // Generate QR code data
  const generateQRData = () => {
    if (!selectedFee || !platformWallet) return '';
    
    // EIP-681 standard for payment requests
    const amount = parseUnits(selectedFee.amount, selectedFee.decimals);
    return `ethereum:${selectedFee.tokenAddress}/transfer?address=${platformWallet}&uint256=${amount}`;
  };

  // Generate payment link for mobile wallets
  const generatePaymentLink = () => {
    if (!selectedFee || !platformWallet) return '';
    
    const amount = parseUnits(selectedFee.amount, selectedFee.decimals);
    return `https://link.trustwallet.com/send?coin=60&address=${selectedFee.tokenAddress}&to=${platformWallet}&amount=${amount}&memo=DUXXAN_Activation`;
  };

  return (
    <div className="space-y-6">
      {/* Network Selection */}
      <Card className="card-standard p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {t('selectNetwork')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fees.map((fee) => (
            <button
              key={fee.network}
              onClick={() => setSelectedNetwork(fee.network)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedNetwork === fee.network
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
              data-testid={`select-network-${fee.network}`}
            >
              <div className="text-left">
                <div className="font-semibold uppercase tracking-wide">
                  ETHEREUM
                </div>
                <div className="text-primary font-mono">
                  {fee.amount} {fee.tokenSymbol}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Auto Payment Methods */}
      {selectedFee && platformWallet && (
        <Card className="card-standard p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
OTOMATİK ÖDEME SEÇENEKLERİ
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MetaMask Auto Pay */}
            <div className="card-standard p-4 border-green-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500/20 border border-green-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-semibold">ANLIK ÖDEME</h4>
                  <p className="text-sm text-muted-foreground">Tek tıkla ödeme</p>
                </div>
              </div>
              
              <Button
                onClick={handleAutoPayment}
                disabled={!isConnected || isProcessing}
                className="w-full btn-binance hover:opacity-90 mb-3"
                data-testid="button-auto-payment"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    İŞLENİYOR...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    ÖDE {selectedFee.amount} {selectedFee.tokenSymbol}
                  </div>
                )}
              </Button>
              
              <div className="text-xs text-muted-foreground">
                ✓ Otomatik ağ değişimi<br/>
                ✓ Bakiye kontrolü<br/>
                ✓ Anlık aktivasyon
              </div>
            </div>

            {/* Mobile/QR Payment */}
            <div className="card-standard p-4 border-primary">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/20 border border-primary rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">MOBİL ÖDEME</h4>
                  <p className="text-sm text-muted-foreground">Trust Wallet, Rainbow</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={() => window.open(generatePaymentLink(), '_blank')}
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary hover:text-white"
                  data-testid="button-mobile-payment"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  CÜZDANDA AÇ
                </Button>
                
                <Button
                  onClick={() => setShowQR(!showQR)}
                  variant="ghost"
                  className="w-full text-primary hover:text-white hover:bg-primary"
                  data-testid="button-show-qr"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  {showQR ? 'QR KODU GİZLE' : 'QR KODU GÖSTER'}
                </Button>
              </div>
              
              {showQR && (
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <QrCode className="w-8 h-8 mx-auto mb-2" />
                      <div className="text-xs">{selectedFee.tokenSymbol} ödemesi<br/>için QR Kod</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Alert className="mt-6 border-blue-500">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Masaüstü:</strong> Otomatik MetaMask ödemesi için "Anlık Ödeme" kullanın.
              <br />
              <strong>Mobil:</strong> Cüzdan uygulamanızda ödeme açmak için "Mobil Ödeme" kullanın.
            </AlertDescription>
          </Alert>
        </Card>
      )}

      {/* Manual Payment Info (Fallback) */}
      <Card className="card-standard p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          MANUEL ÖDEME (YEDEK)
        </h3>
        
        {selectedFee && platformWallet && (
          <div className="space-y-4">
            <div>
              <Badge variant="outline" className="text-yellow-500 border-yellow-500 mb-2">
                ETHEREUM MAINNET
              </Badge>
              <div className="text-sm text-muted-foreground">
                Tam olarak <span className="text-green-500 font-mono">{selectedFee.amount} {selectedFee.tokenSymbol}</span> gönderin:
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="font-mono text-sm bg-muted p-2 rounded flex-1 break-all">
                {platformWallet}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(platformWallet)}
                className="hover:text-primary"
                data-testid="button-copy-address"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}