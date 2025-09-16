import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ExternalLink, Download } from "lucide-react";

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  downloadUrl: string;
  detected: boolean;
  priority: number;
}

interface WalletSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletSelect: (walletId: string) => void;
  isConnecting: boolean;
}

export default function WalletSelectionModal({ 
  isOpen, 
  onClose, 
  onWalletSelect, 
  isConnecting 
}: WalletSelectionModalProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  // Detect available wallets
  const detectWallet = (walletId: string): boolean => {
    if (typeof window === 'undefined') return false;
    
    switch (walletId) {
      case 'trust':
        return !!(window.trustwallet?.ethereum || window.ethereum?.isTrustWallet);
      case 'metamask':
        return !!(window.ethereum?.isMetaMask);
      case 'coinbase':
        return !!(window.ethereum?.isCoinbaseWallet || window.coinbaseWalletExtension);
      case 'okx':
        return !!(window.ethereum?.isOkxWallet || window.okxwallet);
      case 'binance':
        return !!(window.ethereum?.isBinance || window.BinanceChain);
      case 'brave':
        return !!(window.ethereum?.isBraveWallet);
      default:
        return !!(window.ethereum);
    }
  };

  const walletOptions: WalletOption[] = [
    {
      id: 'trust',
      name: 'Trust Wallet',
      icon: '🛡️',
      description: 'Most popular mobile wallet',
      downloadUrl: 'https://trustwallet.com/',
      detected: detectWallet('trust'),
      priority: 1
    },
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Most popular browser wallet',
      downloadUrl: 'https://metamask.io/',
      detected: detectWallet('metamask'),
      priority: 2
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🟦',
      description: 'Official Coinbase wallet',
      downloadUrl: 'https://www.coinbase.com/wallet',
      detected: detectWallet('coinbase'),
      priority: 3
    },
    {
      id: 'okx',
      name: 'OKX Wallet',
      icon: '⚫',
      description: 'Multi-featured Web3 wallet',
      downloadUrl: 'https://www.okx.com/web3',
      detected: detectWallet('okx'),
      priority: 4
    },
    {
      id: 'binance',
      name: 'Binance Wallet',
      icon: '🟡',
      description: 'Optimized for Binance ecosystem',
      downloadUrl: 'https://www.binance.org/',
      detected: detectWallet('binance'),
      priority: 5
    },
    {
      id: 'brave',
      name: 'Brave Wallet',
      icon: '🦁',
      description: 'Built into Brave browser',
      downloadUrl: 'https://brave.com/wallet/',
      detected: detectWallet('brave'),
      priority: 6
    }
  ];

  // Sort by detected first, then by priority
  const sortedWallets = walletOptions.sort((a, b) => {
    if (a.detected && !b.detected) return -1;
    if (!a.detected && b.detected) return 1;
    return a.priority - b.priority;
  });

  const handleWalletClick = (walletId: string) => {
    setSelectedWallet(walletId);
    onWalletSelect(walletId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Select Wallet</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isConnecting}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {sortedWallets.map((wallet) => (
            <div
              key={wallet.id}
              className={`relative p-4 rounded-xl border transition-all duration-200 cursor-pointer
                ${wallet.detected
                  ? 'border-primary/50 bg-primary/5 hover:border-primary hover:bg-primary/10'
                  : 'border-muted bg-muted/20 hover:border-muted-foreground/30'
                }
                ${selectedWallet === wallet.id && isConnecting
                  ? 'border-primary bg-primary/10 pointer-events-none opacity-75'
                  : ''
                }
              `}
              onClick={() => wallet.detected ? handleWalletClick(wallet.id) : window.open(wallet.downloadUrl, '_blank')}
              data-testid={`wallet-option-${wallet.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{wallet.icon}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-foreground">{wallet.name}</h3>
                      {wallet.detected ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                          Detected
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 text-xs">
                          Install
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{wallet.description}</p>
                  </div>
                </div>
                
                {!wallet.detected && (
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                )}
                
                {selectedWallet === wallet.id && isConnecting && (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info text */}
        <div className="mt-6 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="text-lg">💡</div>
            <div>
              <p className="text-sm text-muted-foreground">
                <strong>Mobile:</strong> Download Trust Wallet app<br />
                <strong>Desktop:</strong> Install browser extensions
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}