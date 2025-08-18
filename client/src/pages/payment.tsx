import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AutoPayment from "@/components/AutoPayment";
import WalletConnectButton from "@/components/WalletConnectButton";
import LanguageSelector from "@/components/LanguageSelector";
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
          description: `${result.amount} ${network === 'ethereum' ? 'USDT' : 'BUSD'} ${t('paymentConfirmed')}`,
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
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 cyber-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="hover:text-cyber-cyan">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('back')}
                </Button>
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center neon-border">
                  <Heart className="w-6 h-6 text-background" />
                </div>
                <h1 className="text-xl font-bold neon-text uppercase tracking-wide">
                  {t('duxxan')}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </header>

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
            <Alert className="mb-6 border-cyber-green">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>NEW:</strong> Instant payment with MetaMask! Just click "Instant Pay" for automatic activation.
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