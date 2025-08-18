import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Copy, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";

interface NetworkFee {
  network: string;
  tokenSymbol: string;
  tokenAddress: string;
  amount: string;
  decimals: number;
}

interface PaymentInfoProps {
  onPaymentVerified?: (txHash: string, network: string) => void;
}

export default function PaymentInfo({ onPaymentVerified }: PaymentInfoProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedNetwork, setSelectedNetwork] = useState<string>("ethereum");
  const [txHash, setTxHash] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

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

  const verifyTransaction = async () => {
    if (!txHash.trim()) {
      toast({
        title: t('error'),
        description: t('enterTxHash'),
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch("/api/verify-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          network: selectedNetwork,
          txHash: txHash.trim(),
        }),
      });

      const result = await response.json();

      if (result.valid) {
        toast({
          title: t('paymentVerified'),
          description: `${result.amount} ${result.tokenSymbol} ${t('received')}`,
        });
        onPaymentVerified?.(txHash.trim(), selectedNetwork);
      } else {
        toast({
          title: t('verificationFailed'),
          description: result.error || t('invalidTransaction'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: t('error'),
        description: t('verificationError'),
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getExplorerUrl = (network: string, txHash: string) => {
    const explorers: Record<string, string> = {
      ethereum: `https://etherscan.io/tx/${txHash}`,
      bsc: `https://bscscan.com/tx/${txHash}`,
    };
    return explorers[network] || '#';
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
            >
              <div className="text-left">
                <div className="font-semibold uppercase tracking-wide">
                  {fee.network === 'ethereum' ? 'ETHEREUM' : 'BSC'}
                </div>
                <div className="text-cyber-cyan font-mono">
                  {fee.amount} {fee.tokenSymbol}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Payment Instructions */}
      {selectedFee && platformWallet && (
        <Card className="cyber-card p-6">
          <h3 className="text-lg font-semibold neon-text mb-4 uppercase tracking-wide">
            {t('paymentInstructions')}
          </h3>
          
          <Alert className="mb-4 border-cyber-purple">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {t('paymentWarning')}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {/* Network Info */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {t('network')}
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-cyber-cyan border-cyber-cyan">
                  {selectedNetwork === 'ethereum' ? 'ETHEREUM MAINNET' : 'BSC MAINNET'}
                </Badge>
              </div>
            </div>

            {/* Amount */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {t('amount')}
              </Label>
              <div className="text-lg font-mono text-cyber-green mt-1">
                {selectedFee.amount} {selectedFee.tokenSymbol}
              </div>
            </div>

            {/* Platform Wallet Address */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {t('platformWallet')}
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="font-mono text-sm bg-muted p-2 rounded flex-1 break-all">
                  {platformWallet}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(platformWallet)}
                  className="hover:text-cyber-cyan"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Token Contract Address */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {selectedFee.tokenSymbol} {t('contractAddress')}
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="font-mono text-sm bg-muted p-2 rounded flex-1 break-all">
                  {selectedFee.tokenAddress}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(selectedFee.tokenAddress)}
                  className="hover:text-cyber-cyan"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Transaction Verification */}
      <Card className="cyber-card p-6">
        <h3 className="text-lg font-semibold neon-text mb-4 uppercase tracking-wide">
          {t('verifyPayment')}
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="txHash" className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {t('transactionHash')}
            </Label>
            <Input
              id="txHash"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="0x..."
              className="mt-1 font-mono"
              data-testid="input-txhash"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={verifyTransaction}
              disabled={!txHash.trim() || isVerifying}
              className="gradient-primary hover:opacity-90"
              data-testid="button-verify-payment"
            >
              {isVerifying ? t('verifying') + '...' : t('verifyPayment')}
            </Button>
            
            {txHash.trim() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(getExplorerUrl(selectedNetwork, txHash.trim()), '_blank')}
                className="hover:text-cyber-cyan"
                data-testid="button-view-explorer"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                {t('viewOnExplorer')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Step-by-step Guide */}
      <Card className="cyber-card p-6">
        <h3 className="text-lg font-semibold neon-text mb-4 uppercase tracking-wide">
          {t('howToPay')}
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="text-cyber-cyan border-cyber-cyan min-w-fit">1</Badge>
            <div>{t('step1ConnectWallet')}</div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="text-cyber-cyan border-cyber-cyan min-w-fit">2</Badge>
            <div>{t('step2SelectNetwork')}</div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="text-cyber-cyan border-cyber-cyan min-w-fit">3</Badge>
            <div>{t('step3SendTokens')}</div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="text-cyber-cyan border-cyber-cyan min-w-fit">4</Badge>
            <div>{t('step4CopyTxHash')}</div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="text-cyber-cyan border-cyber-cyan min-w-fit">5</Badge>
            <div>{t('step5VerifyHere')}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}