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
    handleDirectPurchase();
  };

  // Simple direct purchase options
  const handleDirectPurchase = () => {
    if (!isConnected || !address) {
      onError?.('Lütfen önce cüzdanınızı bağlayın');
      return;
    }

    // Show direct purchase options
    setIsOpen(true);
  };

  const openBinanceP2P = () => {
    const binanceUrl = 'https://p2p.binance.com/tr/trade/buy/USDT';
    window.open(binanceUrl, '_blank');
    setIsOpen(false);
    onSuccess?.('binance-p2p-opened');
  };

  const openKuCoinP2P = () => {
    const kucoinUrl = 'https://www.kucoin.com/tr/otc';
    window.open(kucoinUrl, '_blank');
    setIsOpen(false);
    onSuccess?.('kucoin-p2p-opened');
  };

  const openBybitP2P = () => {
    const bybitUrl = 'https://www.bybit.com/fiat/trade/otc/';
    window.open(bybitUrl, '_blank');
    setIsOpen(false);
    onSuccess?.('bybit-p2p-opened');
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
            {/* Info */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 212, 255, 0.1))',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              borderRadius: '15px',
              padding: '16px'
            }}>
              <div className="flex items-center space-x-3">
                <ExternalLink className="w-5 h-5" style={{ color: '#00ff88' }} />
                <div>
                  <p style={{ color: '#ffffff', fontSize: '0.9rem', margin: 0 }}>
                    Güvenilir borsalardan USDT satın alın
                  </p>
                  <p style={{ color: '#888', fontSize: '0.8rem', margin: 0 }}>
                    Satın aldıktan sonra cüzdan adresinize gönderin: <br />
                    <code style={{ color: '#00d4ff', fontSize: '0.75rem' }}>{address}</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Exchange Options */}
            <div className="space-y-3">
              <h3 style={{
                color: '#ffffff',
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '12px',
                fontFamily: "'Orbitron', monospace"
              }}>
                Kripto Borsalar
              </h3>

              {/* Binance */}
              <div 
                onClick={openBinanceP2P}
                style={{
                  background: 'linear-gradient(135deg, rgba(243, 186, 47, 0.1), rgba(243, 186, 47, 0.05))',
                  border: '1px solid rgba(243, 186, 47, 0.3)',
                  borderRadius: '15px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                className="hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 style={{ color: '#F3BA2F', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      Binance P2P
                    </h4>
                    <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
                      Türk Lirası ile USDT satın alın
                    </p>
                  </div>
                  <ExternalLink className="w-5 h-5" style={{ color: '#F3BA2F' }} />
                </div>
              </div>

              {/* KuCoin */}
              <div 
                onClick={openKuCoinP2P}
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 180, 119, 0.1), rgba(34, 180, 119, 0.05))',
                  border: '1px solid rgba(34, 180, 119, 0.3)',
                  borderRadius: '15px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                className="hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 style={{ color: '#22B477', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      KuCoin P2P
                    </h4>
                    <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
                      Düşük komisyon, hızlı işlem
                    </p>
                  </div>
                  <ExternalLink className="w-5 h-5" style={{ color: '#22B477' }} />
                </div>
              </div>

              {/* Bybit */}
              <div 
                onClick={openBybitP2P}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 180, 0, 0.1), rgba(255, 180, 0, 0.05))',
                  border: '1px solid rgba(255, 180, 0, 0.3)',
                  borderRadius: '15px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                className="hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 style={{ color: '#FFB400', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      Bybit P2P
                    </h4>
                    <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
                      Güvenli ve kolay kullanım
                    </p>
                  </div>
                  <ExternalLink className="w-5 h-5" style={{ color: '#FFB400' }} />
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 0, 255, 0.1))',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              borderRadius: '15px',
              padding: '16px'
            }}>
              <h4 style={{ color: '#00d4ff', fontSize: '0.9rem', fontWeight: '600', margin: '0 0 8px 0' }}>
                Nasıl Kullanılır:
              </h4>
              <ol style={{ color: '#cccccc', fontSize: '0.8rem', margin: 0, paddingLeft: '16px' }}>
                <li>Yukarıdaki borsalardan birini seçin</li>
                <li>Hesap oluşturun ve kimlik doğrulama yapın</li>
                <li>P2P bölümünden USDT satın alın</li>
                <li>USDT'yi cüzdan adresinize gönderin</li>
                <li>DUXXAN'da bağış yapmaya başlayın!</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}