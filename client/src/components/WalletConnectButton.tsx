import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { Wallet } from "lucide-react";

export default function WalletConnectButton() {
  const { isConnected, address, isConnecting, connect, disconnect } = useWallet();
  const { t } = useLanguage();
  
  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-2 sm:space-x-3">
        <Badge className="bg-primary text-primary-foreground border-primary/50 px-3 py-2 sm:px-4 sm:py-2 rounded-2xl flex items-center space-x-1.5 sm:space-x-2 transition-all duration-300 touch-manipulation" data-testid="wallet-connected">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div className="flex flex-col items-start">
            <span className="text-xs text-primary-foreground/70 font-medium hidden sm:block">
              MetaMask
            </span>
            <span className="text-xs sm:text-sm font-medium font-mono">
              {address.slice(0, 4)}...{address.slice(-3)}
            </span>
          </div>
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className="hover:text-red-600 border-muted-foreground/20 transition-all duration-200 h-11 px-3 sm:h-11 sm:px-4 touch-manipulation text-xs sm:text-sm min-h-11"
          data-testid="button-disconnect-wallet"
        >
          <span className="hidden sm:inline">{t('disconnect')}</span>
          <span className="sm:hidden">{t('disconnect_short')}</span>
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => connect()}
      disabled={isConnecting}
      className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 sm:px-6 sm:py-3 rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 touch-manipulation text-sm sm:text-base min-h-11 sm:min-h-12"
      data-testid="button-connect-wallet"
    >
      <Wallet className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
      {isConnecting ? t('connecting') : t('connect_wallet')}
      <div className="text-xs text-primary-foreground/70 ml-1.5 sm:ml-2 hidden sm:block">
        🦊
      </div>
    </Button>
  );
}
