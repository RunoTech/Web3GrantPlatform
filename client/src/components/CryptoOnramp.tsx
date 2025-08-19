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
    handleUniswapPurchase();
  };

  // Uniswap Widget integration for real onramp
  const handleUniswapPurchase = () => {
    if (!isConnected || !address) {
      onError?.('Lütfen önce cüzdanınızı bağlayın');
      return;
    }
    setIsOpen(true);
  };

  // Create Uniswap widget URL - supports fiat onramp
  const createUniswapUrl = () => {
    const baseUrl = 'https://app.uniswap.org';
    const params = new URLSearchParams({
      theme: 'dark',
      tokenList: 'default',
      defaultOutputTokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT contract
      exactAmount: targetAmount.toString(),
      exactField: 'output'
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
          
          <div className="p-6 space-y-6">
            {/* Info Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 212, 255, 0.1))',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              borderRadius: '15px',
              padding: '16px'
            }}>
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5" style={{ color: '#00ff88' }} />
                <div>
                  <p style={{ color: '#ffffff', fontSize: '0.9rem', margin: 0 }}>
                    Kripto satın almak için Uniswap'ı kullanın
                  </p>
                  <p style={{ color: '#888', fontSize: '0.8rem', margin: 0 }}>
                    Cüzdan adresi: <code style={{ color: '#00d4ff', fontSize: '0.75rem' }}>{address}</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Uniswap Access */}
            <div 
              onClick={() => window.open(createUniswapUrl(), '_blank')}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 0, 122, 0.1), rgba(255, 0, 122, 0.05))',
                border: '2px solid rgba(255, 0, 122, 0.3)',
                borderRadius: '20px',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              className="hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 style={{ color: '#FF007A', fontSize: '1.3rem', fontWeight: '700', margin: '0 0 8px 0', fontFamily: "'Orbitron', monospace" }}>
                    Uniswap DeFi
                  </h3>
                  <p style={{ color: '#ffffff', fontSize: '1rem', margin: '0 0 4px 0' }}>
                    Dünyanın en büyük DeFi borsası
                  </p>
                  <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
                    • Kredi kartı desteği • USDT direkt satın alma • Güvenli DeFi protokolü
                  </p>
                </div>
                <ExternalLink className="w-8 h-8" style={{ color: '#FF007A' }} />
              </div>
            </div>

            {/* Alternative Options */}
            <div className="space-y-3">
              <h4 style={{
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: '12px',
                fontFamily: "'Orbitron', monospace"
              }}>
                Alternatif Yöntemler
              </h4>

              {/* Coinbase */}
              <div 
                onClick={() => window.open('https://www.coinbase.com/tr/price/tether', '_blank')}
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 82, 255, 0.1), rgba(0, 82, 255, 0.05))',
                  border: '1px solid rgba(0, 82, 255, 0.3)',
                  borderRadius: '15px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                className="hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 style={{ color: '#0052FF', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      Coinbase
                    </h4>
                    <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
                      Dünya çapında güvenilir borsa
                    </p>
                  </div>
                  <ExternalLink className="w-5 h-5" style={{ color: '#0052FF' }} />
                </div>
              </div>

              {/* Kraken */}
              <div 
                onClick={() => window.open('https://www.kraken.com/tr-tr/', '_blank')}
                style={{
                  background: 'linear-gradient(135deg, rgba(91, 59, 221, 0.1), rgba(91, 59, 221, 0.05))',
                  border: '1px solid rgba(91, 59, 221, 0.3)',
                  borderRadius: '15px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                className="hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 style={{ color: '#5B3BDD', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      Kraken
                    </h4>
                    <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
                      Düşük komisyon, yüksek güvenlik
                    </p>
                  </div>
                  <ExternalLink className="w-5 h-5" style={{ color: '#5B3BDD' }} />
                </div>
              </div>
            </div>

            {/* Quick Instructions */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 0, 255, 0.1))',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              borderRadius: '15px',
              padding: '16px'
            }}>
              <h4 style={{ color: '#00d4ff', fontSize: '0.9rem', fontWeight: '600', margin: '0 0 8px 0' }}>
                ⚡ Hızlı Başlangıç:
              </h4>
              <ol style={{ color: '#cccccc', fontSize: '0.8rem', margin: 0, paddingLeft: '16px' }}>
                <li>Uniswap'a tıklayın (en hızlı yöntem)</li>
                <li>Cüzdanınızı bağlayın</li>
                <li>Kredi kartı ile USDT satın alın</li>
                <li>DUXXAN'a geri dönerek bağış yapın!</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}