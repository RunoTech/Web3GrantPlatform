import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import { Wallet, ChevronDown } from "lucide-react";
import { getWalletName } from "@/utils/wallet";
import WalletSelectionModal from "@/components/WalletSelectionModal";

export default function WalletConnectButton() {
  const { isConnected, address, isConnecting, isInitialized, connect, disconnect } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Don't show anything until wallet state is initialized
  if (!isInitialized) {
    return null;
  }
  
  if (isConnected && address) {
    const walletName = getWalletName();
    
    return (
      <div className="flex items-center space-x-3">
        <Badge className="bg-primary text-primary-foreground border-primary/50 px-4 py-2 rounded-2xl flex items-center space-x-2 transition-all duration-300" data-testid="wallet-connected">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div className="flex flex-col items-start">
            <span className="text-xs text-primary-foreground/70 font-medium">
              {walletName}
            </span>
            <span className="text-sm font-medium font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className="hover:text-red-600 border-muted-foreground/20 transition-all duration-200"
          data-testid="button-disconnect-wallet"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  const handleWalletSelect = (walletId: string) => {
    // Close modal and trigger connection with selected wallet
    setShowWalletModal(false);
    connect(walletId);
  };

  return (
    <>
      <Button
        onClick={() => setShowWalletModal(true)}
        disabled={isConnecting}
        className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all duration-300"
        data-testid="button-connect-wallet"
      >
        <Wallet className="w-5 h-5 mr-2" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
        <div className="text-xs text-primary-foreground/70 ml-2">
          (Multiple Options)
        </div>
      </Button>

      <WalletSelectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onWalletSelect={handleWalletSelect}
        isConnecting={isConnecting}
      />
    </>
  );
}
