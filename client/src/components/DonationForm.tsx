import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { Heart, Wallet, Send, CheckCircle } from "lucide-react";
import { ethers } from "ethers";

interface DonationFormProps {
  campaignId: number;
  ownerWallet: string;
  campaignTitle: string;
  onSuccess?: () => void;
}

// USDT Contract on Ethereum Mainnet
const USDT_CONTRACT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

export default function DonationForm({ campaignId, ownerWallet, campaignTitle, onSuccess }: DonationFormProps) {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { isConnected, address, connect, getProvider, checkNetwork, switchToMainnet } = useWallet();
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error: any) {
      toast({
        title: "Bağlantı Hatası",
        description: error.message || "Cüzdan bağlantısı başarısız",
        variant: "destructive",
      });
    }
  };

  const handleDonate = async () => {
    if (!amount || !isConnected || !address) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen miktar girin ve cüzdanınızı bağlayın",
        variant: "destructive",
      });
      return;
    }

    const donationAmount = parseFloat(amount);
    if (donationAmount <= 0) {
      toast({
        title: "Geçersiz Miktar",
        description: "Lütfen geçerli bir miktar girin",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Get provider from wallet hook (supports both MetaMask and WalletConnect)
      const walletProvider = getProvider();
      if (!walletProvider) {
        throw new Error('Wallet provider not found. Please connect your wallet.');
      }

      // Check if we're on Ethereum mainnet
      const isCorrectNetwork = await checkNetwork();
      if (!isCorrectNetwork) {
        toast({
          title: "Wrong Network",
          description: "Switching to Ethereum Mainnet...",
        });
        
        const switched = await switchToMainnet();
        if (!switched) {
          throw new Error('Please switch to Ethereum Mainnet to continue.');
        }
        
        // Wait a moment for network switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const provider = new ethers.BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      
      // Create USDT contract instance
      const usdtContract = new ethers.Contract(USDT_CONTRACT, ERC20_ABI, signer);
      
      // Check balance first
      const balance = await usdtContract.balanceOf(address);
      const formattedBalance = ethers.formatUnits(balance, 6); // USDT has 6 decimals
      
      if (parseFloat(formattedBalance) < donationAmount) {
        toast({
          title: "Yetersiz Bakiye",
          description: `USDT bakiyeniz: ${formattedBalance} USDT`,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Convert amount to contract units (6 decimals for USDT)
      const transferAmount = ethers.parseUnits(amount, 6);

      toast({
        title: "İşlem Başlatılıyor",
        description: "Cüzdanınızda işlemi onaylayın...",
      });

      // Execute transfer
      const tx = await usdtContract.transfer(ownerWallet, transferAmount);

      toast({
        title: "İşlem Gönderildi",
        description: `Transaction Hash: ${tx.hash.slice(0, 10)}...`,
      });

      // Wait for confirmation
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        toast({
          title: "Bağış Başarılı! 🎉",
          description: `${amount} USDT başarıyla gönderildi. Sistem otomatik kaydedecek.`,
        });
        
        setAmount("");
        onSuccess?.();
      } else {
        throw new Error("Transaction failed");
      }

    } catch (error: any) {
      console.error("Donation error:", error);
      
      let errorMessage = "Bağış işlemi başarısız";
      
      if (error.code === 4001) {
        errorMessage = "İşlem kullanıcı tarafından iptal edildi";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Yetersiz bakiye veya gas ücreti";
      } else if (error.message.includes("network")) {
        errorMessage = "Ağ bağlantısı sorunu. Ethereum Mainnet'te olduğunuzdan emin olun";
      }
      
      toast({
        title: "İşlem Başarısız",
        description: errorMessage,
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Heart className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-green-800">Bağış Yap</h3>
        </div>

        {!isConnected ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-slate-600">
              Bağış yapmak için önce cüzdanınızı bağlayın
            </p>
            <Button 
              onClick={handleConnect}
              className="w-full bg-primary text-primary-foreground"
              data-testid="button-connect-for-donation"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Cüzdan Bağla
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-mono text-slate-600">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Bağış Miktarı (USDT)
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg font-semibold"
                min="0"
                step="0.01"
                data-testid="input-donation-amount"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Alıcı:</strong> {ownerWallet.slice(0, 10)}...{ownerWallet.slice(-4)}
              </p>
              <p className="text-xs text-blue-700">
                <strong>Kampanya:</strong> {campaignTitle}
              </p>
            </div>

            <Button 
              onClick={handleDonate}
              disabled={isProcessing || !amount}
              className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 font-semibold"
              data-testid="button-make-donation"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>İşlem Yapılıyor...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Bağış Yap</span>
                </div>
              )}
            </Button>

            <p className="text-xs text-slate-500 text-center">
              İşlem onaylandıktan sonra bağışınız otomatik kaydedilir
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}