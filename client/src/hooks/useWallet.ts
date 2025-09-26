import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';

// Wallet types for window.ethereum
interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function useWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Target chain configuration (constant to prevent hook order changes)
  const TARGET_CHAIN_ID = useMemo(() => import.meta.env.VITE_TARGET_CHAIN_ID || '0x1', []); // Ethereum Mainnet

  // Centralized network verification
  const verifyAndSwitchNetwork = useCallback(async (): Promise<boolean> => {
    if (!window.ethereum) return false;

    try {
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      if (chainId === TARGET_CHAIN_ID) {
        return true;
      }

      // Attempt to switch to target network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: TARGET_CHAIN_ID }],
        });
        return true;
      } catch (switchError: any) {
        // User rejected switch
        toast({
          title: "Ağ Hatası",
          description: "Lütfen Ethereum Mainnet'e geçin",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Network verification error:', error);
      }
      return false;
    }
  }, [toast, TARGET_CHAIN_ID]);

  // Check if we have existing accounts (auto-connect)
  const checkExistingConnection = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });

      if (accounts && accounts.length > 0) {
        // Verify network before setting connected state
        const networkOk = await verifyAndSwitchNetwork();
        if (networkOk) {
          setAddress(accounts[0]);
          setIsConnected(true);
        } else {
          // Wrong network and user rejected switch
          setAddress(null);
          setIsConnected(false);
        }
      }
    } catch (error) {
      // No existing connection - this is normal
    }
  }, [verifyAndSwitchNetwork]);

  // Simple, reliable connect function
  const connect = useCallback(async (): Promise<boolean> => {
    if (isConnecting) return false;
    
    setIsConnecting(true);
    
    try {
      // Check if MetaMask exists
      if (!window.ethereum) {
        toast({
          title: "MetaMask Bulunamadı",
          description: "Lütfen MetaMask uzantısını yükleyin",
          variant: "destructive"
        });
        return false;
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('Hesap bulunamadı');
      }

      // Verify and switch network if needed
      const networkOk = await verifyAndSwitchNetwork();
      if (!networkOk) {
        return false;
      }

      // Success! Set connection state
      setAddress(accounts[0]);
      setIsConnected(true);
      
      toast({
        title: "Başarılı Bağlantı!",
        description: `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)} bağlandı`,
      });

      return true;

    } catch (error: any) {
      // Log error for debugging in development only
      if (import.meta.env.DEV) {
        console.error('Connection error:', error);
      }
      
      let message = "Bağlantı başarısız";
      if (error.code === 4001) {
        message = "Kullanıcı bağlantıyı reddetti";
      } else if (error.message) {
        message = error.message;
      }

      toast({
        title: "Bağlantı Hatası",
        description: message,
        variant: "destructive"
      });

      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, toast, verifyAndSwitchNetwork]);

  // Simple disconnect
  const disconnect = useCallback(() => {
    setAddress(null);
    setIsConnected(false);
    
    toast({
      title: "Bağlantı Kesildi",
      description: "Cüzdan bağlantısı sonlandırıldı"
    });
  }, [toast]);

  // Handle MetaMask events
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        disconnect();
      } else {
        // Verify network before setting connected state
        const networkOk = await verifyAndSwitchNetwork();
        if (networkOk) {
          setAddress(accounts[0]);
          setIsConnected(true);
        } else {
          // Wrong network and user rejected switch
          setAddress(null);
          setIsConnected(false);
        }
      }
    };

    const handleChainChanged = async () => {
      // Re-verify network instead of full page reload
      if (isConnected) {
        const networkOk = await verifyAndSwitchNetwork();
        if (!networkOk) {
          // Wrong network and user rejected switch - disconnect
          setAddress(null);
          setIsConnected(false);
          toast({
            title: "Ağ Değiştirildi",
            description: "Lütfen Ethereum Mainnet'e geçin",
            variant: "destructive"
          });
        }
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [disconnect, isConnected, verifyAndSwitchNetwork, toast]);

  // Check for existing connection on mount
  useEffect(() => {
    checkExistingConnection();
  }, [checkExistingConnection]);

  return {
    isConnected,
    address,
    isConnecting,
    connect,
    disconnect
  };
}