import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  CreditCard, 
  X,
  ExternalLink
} from "lucide-react";

interface CryptoOnrampProps {
  targetAmount?: number;
  targetCurrency?: 'USDT' | 'USDC' | 'ETH' | 'BNB';
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
}

export default function CryptoOnramp({ 
  targetAmount = 100, 
  targetCurrency = 'USDT',
  onSuccess,
  onError 
}: CryptoOnrampProps) {
  const { address, isConnected } = useWallet();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const openCryptoOnramp = () => {
    handleRampPurchase();
  };

  // Ramp Network integration - no API key required
  const handleRampPurchase = () => {
    if (!isConnected || !address) {
      onError?.('Lütfen önce cüzdanınızı bağlayın');
      return;
    }
    setIsOpen(true);
  };

  // Create Ramp widget URL
  const createRampUrl = () => {
    const baseUrl = 'https://buy.ramp.network';
    const params = new URLSearchParams({
      swapAsset: `${targetCurrency}_*`, // USDT on any supported network
      userAddress: address || '',
      fiatCurrency: 'USD,EUR,GBP,TRY', // Support multiple currencies including Turkish Lira
      fiatValue: targetAmount.toString(),
      hostAppName: 'DUXXAN',
      hostLogoUrl: window.location.origin + '/logo.png',
      finalUrl: window.location.origin,
      variant: 'embedded-desktop',
      webhookStatusUrl: window.location.origin + '/api/ramp-webhook'
    });
    
    return `${baseUrl}?${params.toString()}`;
  };



  return (
    <>
      <Button 
        onClick={openCryptoOnramp}
        disabled={!isConnected}
        style={{
          background: 'linear-gradient(45deg, #00d4ff, #ff00ff)',
          color: '#000',
          fontFamily: "'Orbitron', monospace",
          fontSize: '0.9rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          padding: '12px 24px',
          borderRadius: '20px',
          border: 'none',
          boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)',
          transition: 'all 0.3s ease'
        }}
        className="hover:scale-105"
        data-testid="button-buy-crypto"
      >
        <CreditCard className="w-5 h-5 mr-2" />
        Kripto Satın Al
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md p-0" style={{
          background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95), rgba(20, 20, 20, 0.95))',
          border: '2px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '20px',
          backdropFilter: 'blur(20px)',
          minHeight: '600px'
        }}>
          <DialogHeader className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle style={{
                fontSize: '1.2rem',
                fontWeight: '700',
                background: 'linear-gradient(45deg, #00d4ff, #ff00ff)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                fontFamily: "'Orbitron', monospace"
              }}>
                Kripto Satın Al
              </DialogTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsOpen(false)}
                style={{ color: '#888' }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="p-0">
            {/* Embedded Ramp Widget */}
            <iframe
              src={createRampUrl()}
              style={{
                width: '100%',
                height: '680px',
                border: 'none',
                borderRadius: '0 0 20px 20px'
              }}
              title="Kripto Satın Al - Ramp Network"
              allow="payment; camera; microphone; fullscreen"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}