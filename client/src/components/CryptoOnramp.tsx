import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  CreditCard, 
  X,
  Wallet,
  Building2,
  ShoppingCart,
  Settings
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
  const [amount, setAmount] = useState(targetAmount);

  const openCryptoOnramp = () => {
    handleCustomOnramp();
  };

  // Custom onramp purchase handler
  const handleCustomOnramp = () => {
    if (!isConnected || !address) {
      onError?.('Lütfen önce cüzdanınızı bağlayın');
      return;
    }
    setIsOpen(true);
  };

  // MoonPay integration
  const handleMoonPayPurchase = async () => {
    try {
      if (!import.meta.env.VITE_MOONPAY_API_KEY) {
        onError?.('MoonPay API key not configured');
        return;
      }

      // Create MoonPay URL
      const baseUrl = 'https://buy.moonpay.com';
      const params = new URLSearchParams({
        apiKey: import.meta.env.VITE_MOONPAY_API_KEY,
        currencyCode: targetCurrency.toLowerCase(),
        walletAddress: address || '',
        baseCurrencyAmount: amount.toString(),
        baseCurrencyCode: 'usd',
        redirectURL: window.location.origin + '/payment-success',
        theme: 'dark',
        colorCode: '#00ff88'
      });

      // Open MoonPay in popup window
      const moonpayUrl = `${baseUrl}?${params.toString()}`;
      const popup = window.open(
        moonpayUrl,
        'moonpay',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Monitor popup for completion
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          onSuccess?.('MoonPay transaction initiated');
          setIsOpen(false);
        }
      }, 1000);

    } catch (error) {
      console.error('MoonPay error:', error);
      onError?.('MoonPay bağlantı hatası');
    }
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
          
          <div className="p-6 space-y-6">
            {/* Wallet Info */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 212, 255, 0.1))',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              borderRadius: '15px',
              padding: '16px'
            }}>
              <div className="flex items-center space-x-3">
                <Wallet className="w-5 h-5" style={{ color: '#00ff88' }} />
                <div>
                  <p style={{ color: '#ffffff', fontSize: '0.9rem', margin: 0 }}>
                    Bağlı Cüzdan
                  </p>
                  <p style={{ color: '#888', fontSize: '0.8rem', margin: 0 }}>
                    <code style={{ color: '#00d4ff', fontSize: '0.75rem' }}>{address}</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                Satın Alınacak Miktar
              </label>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="100"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    outline: 'none',
                    flex: 1
                  }}
                />
                <span style={{ color: '#00ff88', fontSize: '0.9rem', fontWeight: '600' }}>
                  {targetCurrency}
                </span>
              </div>
            </div>

            {/* Currency Selection */}
            <div>
              <label style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                Ödeme Yöntemi
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Credit Card */}
                <div 
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05))',
                    border: '2px solid rgba(0, 255, 136, 0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  className="hover:scale-105"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <CreditCard className="w-5 h-5" style={{ color: '#00ff88' }} />
                    <span style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: '600' }}>
                      Kredi Kartı
                    </span>
                  </div>
                </div>

                {/* Bank Transfer */}
                <div 
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 212, 255, 0.05))',
                    border: '2px solid rgba(0, 212, 255, 0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  className="hover:scale-105"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Building2 className="w-5 h-5" style={{ color: '#00d4ff' }} />
                    <span style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: '600' }}>
                      Banka
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase Summary */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 0, 255, 0.1), rgba(0, 212, 255, 0.1))',
              border: '1px solid rgba(255, 0, 255, 0.3)',
              borderRadius: '15px',
              padding: '16px'
            }}>
              <h4 style={{ color: '#ff00ff', fontSize: '0.9rem', fontWeight: '600', margin: '0 0 8px 0' }}>
                İşlem Özeti
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span style={{ color: '#888', fontSize: '0.8rem' }}>Miktar:</span>
                  <span style={{ color: '#ffffff', fontSize: '0.8rem' }}>{amount} {targetCurrency}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#888', fontSize: '0.8rem' }}>Ağ:</span>
                  <span style={{ color: '#ffffff', fontSize: '0.8rem' }}>Ethereum Mainnet</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#888', fontSize: '0.8rem' }}>Cüzdan:</span>
                  <span style={{ color: '#00d4ff', fontSize: '0.7rem' }}>
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Purchase Button */}
            <div 
              onClick={handleMoonPayPurchase}
              style={{
                background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
                borderRadius: '15px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center'
              }}
              className="hover:scale-105"
            >
              <div className="flex items-center justify-center space-x-2">
                <ShoppingCart className="w-5 h-5" style={{ color: '#000000' }} />
                <span style={{ 
                  color: '#000000', 
                  fontSize: '1.1rem', 
                  fontWeight: '700',
                  fontFamily: "'Orbitron', monospace"
                }}>
                  {amount} {targetCurrency} SATIN AL
                </span>
              </div>
            </div>

            {/* MoonPay Status */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05))',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              borderRadius: '15px',
              padding: '16px'
            }}>
              <div className="flex items-center space-x-3">
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#00ff88'
                }}></div>
                <div>
                  <p style={{ color: '#ffffff', fontSize: '0.9rem', margin: 0 }}>
                    MoonPay Aktif
                  </p>
                  <p style={{ color: '#888', fontSize: '0.8rem', margin: 0 }}>
                    Güvenli kripto satın alma hazır
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}