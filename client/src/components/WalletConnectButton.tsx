import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import { Wallet, ChevronDown } from "lucide-react";

export default function WalletConnectButton() {
  const { isConnected, address, isConnecting, isInitialized, connect, disconnect } = useWallet();

  // Don't show anything until wallet state is initialized
  if (!isInitialized) {
    return null;
  }
  
  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-3">
        <Badge className="bg-primary text-primary-foreground border-primary/50 px-4 py-2 rounded-2xl flex items-center space-x-2 transition-all duration-300" data-testid="wallet-connected">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
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

  return (
    <Button
      onClick={connect}
      disabled={isConnecting}
      className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all duration-300"
      data-testid="button-connect-wallet"
    >
      <Wallet className="w-5 h-5 mr-2" />
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
