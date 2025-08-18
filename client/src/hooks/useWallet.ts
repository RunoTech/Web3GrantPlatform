import { useState, useEffect, useCallback } from 'react';
import { connectWallet, getAccounts, onAccountsChanged, onChainChanged, removeWalletListeners } from '@/utils/wallet';
import { useToast } from '@/hooks/use-toast';

export function useWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const checkConnection = useCallback(async () => {
    try {
      const accounts = await getAccounts();
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
      } else {
        setAddress(null);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      setAddress(null);
      setIsConnected(false);
    }
  }, []);

  const connect = useCallback(async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      const connectedAddress = await connectWallet();
      if (connectedAddress) {
        setAddress(connectedAddress);
        setIsConnected(true);
        toast({
          title: "Başarılı!",
          description: "Cüzdan başarıyla bağlandı",
        });
      }
    } catch (error: any) {
      toast({
        title: "Bağlantı Hatası",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, toast]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setIsConnected(false);
    removeWalletListeners();
    toast({
      title: "Bağlantı Kesildi",
      description: "Cüzdan bağlantısı kesildi",
    });
  }, [toast]);

  useEffect(() => {
    checkConnection();

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== address) {
        setAddress(accounts[0]);
        setIsConnected(true);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    onAccountsChanged(handleAccountsChanged);
    onChainChanged(handleChainChanged);

    return () => {
      removeWalletListeners();
    };
  }, [address, disconnect, checkConnection]);

  return {
    isConnected,
    address,
    isConnecting,
    connect,
    disconnect,
  };
}
