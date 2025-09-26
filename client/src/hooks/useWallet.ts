import { useState, useEffect, useCallback } from 'react';
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

  // Check if we have existing accounts (auto-connect)
  const checkExistingConnection = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });

      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
      }
    } catch (error) {
      console.log('No existing connection found');
    }
  }, []);

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

      // Check we're on Ethereum mainnet
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      if (chainId !== '0x1') {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1' }],
          });
        } catch (switchError) {
          toast({
            title: "Ağ Hatası",
            description: "Lütfen Ethereum Mainnet'e geçin",
            variant: "destructive"
          });
          return false;
        }
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
      console.error('Connection error:', error);
      
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
  }, [isConnecting, toast]);

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

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
        setIsConnected(true);
      }
    };

    const handleChainChanged = () => {
      // Reload page to reset everything on chain change
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [disconnect]);

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