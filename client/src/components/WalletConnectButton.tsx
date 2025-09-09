import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import { Wallet, ChevronDown } from "lucide-react";

export default function WalletConnectButton() {
  const { isConnected, address, isConnecting, isLoading, connect, disconnect } = useWallet();

  // Show loading state while checking wallet connection
  if (isLoading) {
    return (
      <div className="flex items-center space-x-3">
        <div className="w-32 h-10 bg-muted animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-3">
        <Badge className="bg-pastel-green px-4 py-2 rounded-2xl flex items-center space-x-2" data-testid="wallet-connected">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-slate-700 font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => disconnect()}
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
      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2.5 rounded-2xl font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
      data-testid="button-connect-wallet"
    >
      <Wallet className="w-5 h-5 mr-2" />
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
