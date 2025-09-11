import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/hooks/useWallet";
import { ethers } from "ethers";
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

// Token ABIs for transfer
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

export default function AutoPayment({ onPaymentSuccess }: AutoPaymentProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { isConnected, address } = useWallet();
  const [selectedNetwork, setSelectedNetwork] = useState<string>("ethereum");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQR, setShowQR] = useState(false);

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

  // Auto payment with MetaMask
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
      // Check if MetaMask is available
      if (typeof window.ethereum === 'undefined') {
        toast({
          title: t('error'),
          description: "MetaMask not detected. Please install MetaMask.",
          variant: "destructive",
        });
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Switch to Ethereum Mainnet
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x1' }], // Ethereum Mainnet
        });
      } catch (switchError: any) {
        toast({
          title: t('error'),
          description: "Please switch to Ethereum Mainnet",
          variant: "destructive",
        });
        return;
      }

      // Create contract instance
      const tokenContract = new ethers.Contract(selectedFee.tokenAddress, ERC20_ABI, signer);

      // Check balance
      const balance = await tokenContract.balanceOf(address);
      const requiredAmount = ethers.parseUnits(selectedFee.amount, selectedFee.decimals);
      
      if (balance < requiredAmount) {
        toast({
          title: t('error'),
          description: `Insufficient ${selectedFee.tokenSymbol} balance`,
          variant: "destructive",
        });
        return;
      }

      // Execute transfer
      const tx = await tokenContract.transfer(platformWallet, requiredAmount);
      
      toast({
        title: "Transaction Sent",
        description: "Please wait for confirmation...",
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        // Auto-activate account with direct activation API
        try {
          const activationResponse = await fetch("/api/direct-activate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              wallet: address,
              network: selectedNetwork,
              txHash: tx.hash,
            }),
          });
          
          const activationResult = await activationResponse.json();
          
          if (activationResult.success) {
            toast({
              title: "Account Activated!",
              description: `${selectedFee.amount} ${selectedFee.tokenSymbol} payment successful`,
            });
            
            onPaymentSuccess?.(tx.hash, selectedNetwork);
          } else {
            throw new Error(activationResult.error || "Activation failed");
          }
        } catch (activationError) {
          console.error("Activation error:", activationError);
          // Still show success for payment
          toast({
            title: "Payment Completed",
            description: "Please refresh the page for account activation",
          });
          
          onPaymentSuccess?.(tx.hash, selectedNetwork);
        }
      } else {
        throw new Error("Transaction failed");
      }

    } catch (error: any) {
      console.error("Auto payment error:", error);
      let errorMessage = "Transaction failed";
      
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = "Transaction was rejected by user";
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = "Insufficient funds for gas fees";
      }
      
      toast({
        title: t('error'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate QR code data
  const generateQRData = () => {
    if (!selectedFee || !platformWallet) return '';
    
    // EIP-681 standard for payment requests
    return `ethereum:${selectedFee.tokenAddress}/transfer?address=${platformWallet}&uint256=${ethers.parseUnits(selectedFee.amount, selectedFee.decimals)}`;
  };

  // Generate payment link for mobile wallets
  const generatePaymentLink = () => {
    if (!selectedFee || !platformWallet) return '';
    
    const amount = ethers.parseUnits(selectedFee.amount, selectedFee.decimals);
    return `https://link.trustwallet.com/send?coin=60&address=${selectedFee.tokenAddress}&to=${platformWallet}&amount=${amount}&memo=DUXXAN_Activation`;
  };

  return (
    <div className="space-y-6">
      {/* Network Selection */}
      <Card className="cyber-card p-6">
        <h3 className="text-lg font-semibold neon-text mb-4 uppercase tracking-wide">
          {t('selectNetwork')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fees.map((fee) => (
            <button
              key={fee.network}
              onClick={() => setSelectedNetwork(fee.network)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedNetwork === fee.network
                  ? 'border-cyber-cyan neon-border bg-cyber-cyan/10'
                  : 'border-border hover:border-cyber-purple'
              }`}
              data-testid={`select-network-${fee.network}`}
            >
              <div className="text-left">
                <div className="font-semibold uppercase tracking-wide">
                  ETHEREUM
                </div>
                <div className="text-cyber-cyan font-mono">
                  {fee.amount} {fee.tokenSymbol}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Auto Payment Methods */}
      {selectedFee && platformWallet && (
        <Card className="cyber-card p-6">
          <h3 className="text-lg font-semibold neon-text mb-6 uppercase tracking-wide">
            AUTOMATIC PAYMENT OPTIONS
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MetaMask Auto Pay */}
            <div className="cyber-card p-4 border-cyber-green">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-cyber-green/20 border border-cyber-green rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyber-green" />
                </div>
                <div>
                  <h4 className="font-semibold uppercase tracking-wide">INSTANT PAY</h4>
                  <p className="text-sm text-muted-foreground">One-click payment</p>
                </div>
              </div>
              
              <Button
                onClick={handleAutoPayment}
                disabled={!isConnected || isProcessing}
                className="w-full gradient-primary hover:opacity-90 mb-3"
                data-testid="button-auto-payment"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    PROCESSING...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    PAY {selectedFee.amount} {selectedFee.tokenSymbol}
                  </div>
                )}
              </Button>
              
              <div className="text-xs text-muted-foreground">
                ✓ Automatic network switch<br/>
                ✓ Balance check<br/>
                ✓ Instant activation
              </div>
            </div>

            {/* Mobile/QR Payment */}
            <div className="cyber-card p-4 border-cyber-purple">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-cyber-purple/20 border border-cyber-purple rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-cyber-purple" />
                </div>
                <div>
                  <h4 className="font-semibold uppercase tracking-wide">MOBILE PAY</h4>
                  <p className="text-sm text-muted-foreground">Trust Wallet, Rainbow</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={() => window.open(generatePaymentLink(), '_blank')}
                  variant="outline"
                  className="w-full border-cyber-purple text-cyber-purple hover:bg-cyber-purple hover:text-white"
                  data-testid="button-mobile-payment"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  OPEN IN WALLET
                </Button>
                
                <Button
                  onClick={() => setShowQR(!showQR)}
                  variant="ghost"
                  className="w-full text-cyber-purple hover:text-white hover:bg-cyber-purple"
                  data-testid="button-show-qr"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  {showQR ? 'HIDE QR CODE' : 'SHOW QR CODE'}
                </Button>
              </div>
              
              {showQR && (
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <QrCode className="w-8 h-8 mx-auto mb-2" />
                      <div className="text-xs">QR Code for<br/>{selectedFee.tokenSymbol} payment</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Alert className="mt-6 border-cyber-cyan">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Desktop:</strong> Use "Instant Pay" for automatic MetaMask payment.
              <br />
              <strong>Mobile:</strong> Use "Mobile Pay" to open payment in your wallet app.
            </AlertDescription>
          </Alert>
        </Card>
      )}

      {/* Manual Payment Info (Fallback) */}
      <Card className="cyber-card p-6">
        <h3 className="text-lg font-semibold neon-text mb-4 uppercase tracking-wide">
          MANUAL PAYMENT (FALLBACK)
        </h3>
        
        {selectedFee && platformWallet && (
          <div className="space-y-4">
            <div>
              <Badge variant="outline" className="text-cyber-yellow border-cyber-yellow mb-2">
                ETHEREUM MAINNET
              </Badge>
              <div className="text-sm text-muted-foreground">
                Send exactly <span className="text-cyber-green font-mono">{selectedFee.amount} {selectedFee.tokenSymbol}</span> to:
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
                className="hover:text-cyber-cyan"
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