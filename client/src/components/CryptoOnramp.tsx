import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  CreditCard, 
  Banknote, 
  Shield, 
  Zap, 
  Globe, 
  ArrowRight,
  CheckCircle,
  Info
} from "lucide-react";

declare global {
  interface Window {
    transak: any;
  }
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [transakLoaded, setTransakLoaded] = useState(false);

  // Load Transak SDK
  useEffect(() => {
    const loadTransak = async () => {
      if (window.transak) {
        setTransakLoaded(true);
        return;
      }

      try {
        const script = document.createElement('script');
        script.src = 'https://global.transak.com/sdk/v1.2/transak.js';
        script.onload = () => setTransakLoaded(true);
        script.onerror = () => console.error('Failed to load Transak SDK');
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Transak:', error);
      }
    };

    loadTransak();
  }, []);

  const openTransak = () => {
    if (!transakLoaded || !window.transak) {
      console.error('Transak SDK not loaded');
      return;
    }

    if (!isConnected || !address) {
      onError?.('Lütfen önce cüzdanınızı bağlayın');
      return;
    }

    setIsLoading(true);

    try {
      const transak = new window.transak.TransakSDK({
        apiKey: import.meta.env.VITE_TRANSAK_API_KEY || 'test-key',
        environment: import.meta.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'STAGING',
        
        // Widget Configuration
        widgetHeight: '600px',
        widgetWidth: '400px',
        
        // Transaction Details
        defaultCryptoCurrency: targetCurrency,
        defaultFiatAmount: targetAmount,
        defaultNetwork: targetCurrency === 'BNB' ? 'bsc' : 'ethereum',
        walletAddress: address,
        
        // UI Customization
        themeColor: '#00d4ff',
        hostURL: window.location.origin,
        redirectURL: window.location.origin,
        
        // Supported Payment Methods
        paymentMethod: 'credit_debit_card,sepa_bank_transfer',
        
        // Localization
        defaultFiatCurrency: 'USD',
        
        // Hide elements for cleaner UI
        hideMenu: true,
        hideExchangeScreen: false,
      });

      // Event Listeners
      transak.on('TRANSAK_WIDGET_INITIALISED', () => {
        setIsLoading(false);
        console.log('Transak widget initialized');
      });

      transak.on('TRANSAK_ORDER_SUCCESSFUL', (orderData: any) => {
        console.log('Order successful:', orderData);
        onSuccess?.(orderData.status.cryptoTransactionId);
        setIsOpen(false);
      });

      transak.on('TRANSAK_ORDER_FAILED', (orderData: any) => {
        console.error('Order failed:', orderData);
        onError?.('İşlem başarısız oldu. Lütfen tekrar deneyin.');
        setIsOpen(false);
      });

      transak.on('TRANSAK_WIDGET_CLOSE', () => {
        setIsOpen(false);
        setIsLoading(false);
      });

      // Initialize widget
      transak.init();
      setIsOpen(true);

    } catch (error) {
      console.error('Error initializing Transak:', error);
      onError?.('Kripto satın alma servisi yüklenemedi');
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: CreditCard,
      title: 'Kredi Kartı ile Satın Al',
      description: 'Visa, Mastercard, Apple Pay destekli',
      color: '#00d4ff'
    },
    {
      icon: Shield,
      title: 'Güvenli İşlem',
      description: 'KYC/AML uyumlu, SSL korumalı',
      color: '#00ff88'
    },
    {
      icon: Zap,
      title: 'Anında Transfer',
      description: 'Direkt cüzdanınıza gönderim',
      color: '#ff00ff'
    },
    {
      icon: Globe,
      title: 'Global Destek',
      description: 'Türkiye dahil 160+ ülke',
      color: '#ffaa00'
    }
  ];

  const supportedTokens = [
    { symbol: 'USDT', name: 'Tether USD', network: 'Ethereum' },
    { symbol: 'USDC', name: 'USD Coin', network: 'Ethereum' },
    { symbol: 'ETH', name: 'Ethereum', network: 'Ethereum' },
    { symbol: 'BNB', name: 'BNB Chain', network: 'BSC' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          onClick={openTransak}
          disabled={!isConnected || isLoading}
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
          {isLoading ? 'Yükleniyor...' : 'Kripto Satın Al'}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl" style={{
        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(255, 0, 255, 0.05))',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        borderRadius: '20px',
        backdropFilter: 'blur(20px)'
      }}>
        <DialogHeader>
          <DialogTitle style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            background: 'linear-gradient(45deg, #00d4ff, #ff00ff)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            fontFamily: "'Orbitron', monospace",
            textAlign: 'center'
          }}>
            Kripto Para Satın Al
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 212, 255, 0.1))',
            border: '1px solid rgba(0, 255, 136, 0.3)',
            borderRadius: '15px',
            padding: '16px'
          }}>
            <div className="flex items-center space-x-3">
              <Info className="w-5 h-5" style={{ color: '#00ff88' }} />
              <div>
                <p style={{ color: '#ffffff', fontSize: '0.9rem', margin: 0 }}>
                  Kredi kartınızla USDT/USDC satın alın ve direkt bağış yapın
                </p>
                <p style={{ color: '#888', fontSize: '0.8rem', margin: 0 }}>
                  İşlem güvenli ve anında gerçekleşir
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <Card key={index} style={{
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.02))',
                border: `1px solid ${feature.color}40`,
                borderRadius: '15px'
              }}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                    <div>
                      <h4 style={{ 
                        color: '#ffffff', 
                        fontSize: '0.9rem', 
                        fontWeight: '600',
                        margin: 0
                      }}>
                        {feature.title}
                      </h4>
                      <p style={{ 
                        color: '#888', 
                        fontSize: '0.8rem',
                        margin: 0
                      }}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Supported Tokens */}
          <div>
            <h3 style={{
              color: '#ffffff',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '12px',
              fontFamily: "'Orbitron', monospace"
            }}>
              Desteklenen Kripto Paralar
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {supportedTokens.map((token, index) => (
                <div key={index} style={{
                  background: 'rgba(0, 212, 255, 0.05)',
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                  borderRadius: '10px',
                  padding: '12px'
                }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ 
                        color: '#00d4ff', 
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        margin: 0
                      }}>
                        {token.symbol}
                      </p>
                      <p style={{ 
                        color: '#888', 
                        fontSize: '0.8rem',
                        margin: 0
                      }}>
                        {token.name}
                      </p>
                    </div>
                    <Badge variant="outline" style={{
                      borderColor: '#ff00ff40',
                      color: '#ff00ff',
                      fontSize: '0.7rem'
                    }}>
                      {token.network}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              style={{
                borderColor: 'rgba(0, 212, 255, 0.3)',
                color: '#00d4ff',
                fontFamily: "'Orbitron', monospace"
              }}
            >
              İptal
            </Button>
            <Button 
              onClick={openTransak}
              disabled={!isConnected || isLoading}
              style={{
                background: 'linear-gradient(45deg, #00d4ff, #ff00ff)',
                color: '#000',
                fontFamily: "'Orbitron', monospace",
                fontWeight: '600'
              }}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              {isLoading ? 'Başlatılıyor...' : 'Satın Almaya Başla'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}