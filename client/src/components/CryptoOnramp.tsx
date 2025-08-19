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
  Info,
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

  // Simplified onramp - opens provider in new tab
  const openCryptoOnramp = () => {
    if (!isConnected || !address) {
      onError?.('Lütfen önce cüzdanınızı bağlayın');
      return;
    }

    // MoonPay URL with parameters
    const moonpayUrl = new URL('https://buy.moonpay.com');
    moonpayUrl.searchParams.set('apiKey', 'pk_test_bZRq6VcCJJJE9rT7yFZcANFw2P8nJqre'); // Test key
    moonpayUrl.searchParams.set('currencyCode', targetCurrency.toLowerCase());
    moonpayUrl.searchParams.set('walletAddress', address);
    moonpayUrl.searchParams.set('baseCurrencyAmount', targetAmount.toString());
    moonpayUrl.searchParams.set('redirectURL', window.location.origin);
    moonpayUrl.searchParams.set('theme', 'dark');
    moonpayUrl.searchParams.set('colorCode', '#00d4ff');

    // Open in new tab
    const newWindow = window.open(moonpayUrl.toString(), '_blank', 'width=420,height=700,scrollbars=yes,resizable=yes');
    
    if (newWindow) {
      onSuccess?.('crypto-purchase-initiated');
      setIsOpen(false);
    } else {
      onError?.('Pop-up engellendi. Lütfen pop-up engellemesini kaldırın.');
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
      description: 'MoonPay güvencesi, SSL korumalı',
      color: '#00ff88'
    },
    {
      icon: Zap,
      title: 'Anında Transfer',
      description: 'Direkt cüzdanınıza gönderim',
      color: '#ff00ff'
    },
    {
      icon: ExternalLink,
      title: 'Kolay Kullanım',
      description: 'Yeni sekmede açılır, basit arayüz',
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
  );
}