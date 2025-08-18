import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/hooks/useWallet";
import { ethers } from "ethers";
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

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

export default function SimplePayButton({ onPaymentSuccess }: SimplePayButtonProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { isConnected, address } = useWallet();
  const [selectedNetwork, setSelectedNetwork] = useState<string>("ethereum");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: select, 2: processing, 3: success

  const { data: fees = [] } = useQuery<NetworkFee[]>({
    queryKey: ["/api/get-fees"],
  });

  const { data: wallets = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/platform-wallets"],
  });

  const selectedFee = fees.find(fee => fee.network === selectedNetwork);
  const platformWallet = wallets[selectedNetwork];

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
      if (typeof window.ethereum === 'undefined') {
        throw new Error("MetaMask bulunamadı. Lütfen MetaMask yükleyin.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Switch to correct network
      const networkChainId = network === 'ethereum' ? '0x1' : '0x38';
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: networkChainId }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902 && network === 'bsc') {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x38',
              chainName: 'BSC Mainnet',
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: ['https://bsc-dataseed1.binance.org'],
              blockExplorerUrls: ['https://bscscan.com'],
            }],
          });
        }
      }

      const tokenContract = new ethers.Contract(fee.tokenAddress, ERC20_ABI, signer);
      const balance = await tokenContract.balanceOf(address);
      const requiredAmount = ethers.parseUnits(fee.amount, fee.decimals);
      
      if (balance < requiredAmount) {
        throw new Error(`Yetersiz ${fee.tokenSymbol} bakiyesi`);
      }

      const tx = await tokenContract.transfer(wallet, requiredAmount);
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        setStep(3);
        toast({
          title: "Ödeme Başarılı!",
          description: `${fee.amount} ${fee.tokenSymbol} gönderildi`,
        });
        
        onPaymentSuccess?.(tx.hash, network);
      } else {
        throw new Error("İşlem başarısız");
      }

    } catch (error: any) {
      console.error("Payment error:", error);
      
      let errorMessage = "İşlem başarısız";
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = "İşlem kullanıcı tarafından iptal edildi";
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = "Gas ücreti için yetersiz bakiye";
      } else if (error.message?.includes('Yetersiz')) {
        errorMessage = error.message;
      } else if (error.message?.includes('MetaMask')) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      });
      
      setStep(1);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 1: Network Selection
  if (step === 1) {
    return (
      <Card className="cyber-card p-8 max-w-2xl mx-auto">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto neon-border">
            <CreditCard className="w-8 h-8 text-background" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold neon-text mb-2 uppercase tracking-wide">
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
                className="cyber-card p-6 hover:border-cyber-cyan transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="text-2xl font-bold text-cyber-cyan">
                      {fee.amount} {fee.tokenSymbol}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ≈ ${fee.network === 'ethereum' ? '50' : '25'} USD
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-cyber-green">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm font-semibold">OTOMATIK ÖDEME</span>
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
      <Card className="cyber-card p-8 max-w-md mx-auto text-center">
        <div className="space-y-6">
          <div className="w-16 h-16 bg-cyber-cyan/20 border border-cyber-cyan rounded-full flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-cyber-cyan animate-spin" />
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">
              İŞLEM YAPILIYOR
            </h3>
            <p className="text-muted-foreground mb-4">
              MetaMask'ta işleminizi onaylayın
            </p>
            
            {selectedFee && (
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Ödeme Miktarı:</div>
                <div className="text-lg font-bold text-cyber-cyan">
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
      <Card className="cyber-card p-8 max-w-md mx-auto text-center border-cyber-green">
        <div className="space-y-6">
          <div className="w-16 h-16 bg-cyber-green/20 border border-cyber-green rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-cyber-green" />
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-2 text-cyber-green uppercase tracking-wide">
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