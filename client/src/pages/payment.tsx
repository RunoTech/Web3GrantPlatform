import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AutoPayment from "@/components/AutoPayment";
import WalletConnectButton from "@/components/WalletConnectButton";
import LanguageSelector from "@/components/LanguageSelector";
import Header from "@/components/Header";
import CryptoOnramp from "@/components/CryptoOnramp";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Heart, 
  Shield, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Wallet,
  CreditCard 
} from "lucide-react";

export default function PaymentPage() {
  const { isConnected, address } = useWallet();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isActivating, setIsActivating] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  const handlePaymentSuccess = async (txHash: string, network: string) => {
    if (!address) {
      toast({
        title: t('error'),
        description: t('connectWalletFirst'),
        variant: "destructive",
      });
      return;
    }

    setIsActivating(true);
    try {
      const response = await fetch("/api/activate-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: address,
          txHash,
          network,
        }),
      });

      const result = await response.json();

      if (result.success && result.verified) {
        setIsActivated(true);
        toast({
          title: t('accountActivated'),
          description: `${result.amount} USDT ${t('paymentConfirmed')}`,
        });
        
        // Redirect to profile after 3 seconds
        setTimeout(() => {
          setLocation('/profile');
        }, 3000);
      } else {
        toast({
          title: t('activationFailed'),
          description: result.error || t('tryAgain'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Activation error:", error);
      toast({
        title: t('error'),
        description: t('activationError'),
        variant: "destructive",
      });
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header currentPage="payment" />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 neon-border">
            <CreditCard className="w-8 h-8 text-background" />
          </div>
          <h1 className="text-3xl font-bold neon-text mb-2 uppercase tracking-wide">
            {t('activateAccount')}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('activateAccountDescription')}
          </p>
        </div>

        {/* Success State */}
        {isActivated && (
          <Card className="cyber-card p-8 mb-8 text-center border-cyber-green">
            <CheckCircle className="w-16 h-16 text-cyber-green mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-cyber-green mb-2 uppercase tracking-wide">
              {t('accountActivated')}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t('activationSuccess')}
            </p>
            <Badge variant="outline" className="text-cyber-green border-cyber-green">
              {t('redirectingToProfile')}
            </Badge>
          </Card>
        )}

        {/* Wallet Connection Required */}
        {!isConnected && (
          <Card className="cyber-card p-8 mb-8 text-center">
            <Wallet className="w-16 h-16 text-cyber-purple mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-4 uppercase tracking-wide">
              {t('connectWalletRequired')}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t('connectWalletToActivate')}
            </p>
            <WalletConnectButton />
          </Card>
        )}

        {/* Features & Benefits */}
        <Card className="cyber-card p-6 mb-8">
          <h2 className="text-xl font-semibold neon-text mb-6 uppercase tracking-wide">
            {t('activationBenefits')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6 text-background" />
              </div>
              <h3 className="font-semibold mb-2 uppercase tracking-wide">{t('createCampaigns')}</h3>
              <p className="text-sm text-muted-foreground">{t('createCampaignsDesc')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-cyber-purple/20 border border-cyber-purple rounded-lg flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-cyber-purple" />
              </div>
              <h3 className="font-semibold mb-2 uppercase tracking-wide">{t('dailyRewards')}</h3>
              <p className="text-sm text-muted-foreground">{t('dailyRewardsDesc')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-cyber-green/20 border border-cyber-green rounded-lg flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-cyber-green" />
              </div>
              <h3 className="font-semibold mb-2 uppercase tracking-wide">{t('prioritySupport')}</h3>
              <p className="text-sm text-muted-foreground">{t('prioritySupportDesc')}</p>
            </div>
          </div>
        </Card>

        {/* Payment Process */}
        {isConnected && !isActivated && (
          <>
            {/* Payment Options Header */}
            <Card className="cyber-card p-6 mb-6">
              <h2 className="text-xl font-semibold neon-text mb-4 uppercase tracking-wide text-center">
                Ödeme Seçenekleri
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Option 1: Buy Crypto First */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(255, 0, 255, 0.05))',
                  border: '2px solid rgba(0, 212, 255, 0.3)',
                  borderRadius: '15px',
                  padding: '24px',
                  textAlign: 'center'
                }}>
                  <CreditCard className="w-12 h-12 mx-auto mb-4" style={{ color: '#00d4ff' }} />
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '8px',
                    fontFamily: "'Orbitron', monospace"
                  }}>
                    Kredi Kartı ile Kripto Al
                  </h3>
                  <p style={{
                    color: '#888',
                    fontSize: '0.9rem',
                    marginBottom: '16px'
                  }}>
                    Önce kredi kartınızla USDT satın alın, sonra aktivasyon yapın
                  </p>
                  <Badge style={{
                    background: 'rgba(0, 255, 136, 0.2)',
                    color: '#00ff88',
                    border: '1px solid rgba(0, 255, 136, 0.3)',
                    marginBottom: '16px'
                  }}>
                    ÖNERİLEN
                  </Badge>
                  <div>
                    <CryptoOnramp 
                      targetAmount={75}
                      targetCurrency="USDT"
                      onSuccess={(txHash) => {
                        toast({
                          title: "Kripto Satın Alındı!",
                          description: "Şimdi hesap aktivasyonu yapabilirsiniz.",
                        });
                      }}
                      onError={(error) => {
                        toast({
                          title: "Hata",
                          description: error,
                          variant: "destructive",
                        });
                      }}
                    />
                  </div>
                </div>

                {/* Option 2: Direct MetaMask */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(255, 0, 255, 0.05), rgba(0, 255, 136, 0.05))',
                  border: '2px solid rgba(255, 0, 255, 0.3)',
                  borderRadius: '15px',
                  padding: '24px',
                  textAlign: 'center'
                }}>
                  <Wallet className="w-12 h-12 mx-auto mb-4" style={{ color: '#ff00ff' }} />
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: '8px',
                    fontFamily: "'Orbitron', monospace"
                  }}>
                    MetaMask ile Direkt Öde
                  </h3>
                  <p style={{
                    color: '#888',
                    fontSize: '0.9rem',
                    marginBottom: '16px'
                  }}>
                    Cüzdanınızda USDT varsa direkt aktivasyon yapın
                  </p>
                  <Badge style={{
                    background: 'rgba(255, 0, 255, 0.2)',
                    color: '#ff00ff',
                    border: '1px solid rgba(255, 0, 255, 0.3)',
                    marginBottom: '16px'
                  }}>
                    HIZLI
                  </Badge>
                </div>
              </div>
            </Card>

            <Alert className="mb-6 border-cyber-green">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>YENİ:</strong> Kredi kartı ile kripto satın alabilir ve direkt bağış yapabilirsiniz!
              </AlertDescription>
            </Alert>

            <AutoPayment onPaymentSuccess={handlePaymentSuccess} />

            {isActivating && (
              <Card className="cyber-card p-6 mt-6 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-cyber-cyan border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">
                  {t('activatingAccount')}...
                </p>
              </Card>
            )}
          </>
        )}

        {/* FAQ Section */}
        <Card className="cyber-card p-6 mt-8">
          <h2 className="text-xl font-semibold neon-text mb-6 uppercase tracking-wide">
            {t('frequentlyAsked')}
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">{t('whyActivationFee')}</h3>
              <p className="text-sm text-muted-foreground">{t('activationFeeReason')}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">{t('isPaymentSecure')}</h3>
              <p className="text-sm text-muted-foreground">{t('paymentSecurityInfo')}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">{t('howLongActivation')}</h3>
              <p className="text-sm text-muted-foreground">{t('activationTimeInfo')}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">{t('wrongNetwork')}</h3>
              <p className="text-sm text-muted-foreground">{t('wrongNetworkInfo')}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}