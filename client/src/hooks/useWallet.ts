import { useState, useEffect, useCallback } from 'react';
import { connectWallet, getAccounts, onAccountsChanged, onChainChanged, removeWalletListeners, verifyNetwork, switchToEthereumMainnet } from '@/utils/wallet';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export function useWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
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
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const connect = useCallback(async (selectedWalletId?: string) => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      const connectedAddress = await connectWallet(selectedWalletId);
      if (connectedAddress) {
        // Check if referral code exists in localStorage
        const referralCode = localStorage.getItem('referralCode');
        
        // Try to create account with referral if available
        if (referralCode) {
          try {
            await apiRequest("POST", "/api/register-with-referral", {
              wallet: connectedAddress,
              referralCode: referralCode,
            });
            // Clear referral code after successful registration
            localStorage.removeItem('referralCode');
          } catch (error: any) {
            // If referral registration fails, try regular account creation
            try {
              await apiRequest("POST", "/api/create-account", {
                wallet: connectedAddress,
              });
            } catch (createError) {
              // Account might already exist, which is fine
              console.log("Account creation note:", createError);
            }
          }
        } else {
          // No referral code, create regular account
          try {
            await apiRequest("POST", "/api/create-account", {
              wallet: connectedAddress,
            });
          } catch (error) {
            // Account might already exist, which is fine
            console.log("Account creation note:", error);
          }
        }

        setAddress(connectedAddress);
        setIsConnected(true);
        setSelectedWalletId(selectedWalletId || null);
        
        // Auto participate in daily reward if possible
        try {
          const dailyResponse = await apiRequest("POST", "/api/auto-daily-entry", {
            wallet: connectedAddress
          });
          
          if ((dailyResponse as any).success) {
            toast({
              title: "Success!",
              description: "Wallet connected & auto-entered daily reward draw",
            });
          } else {
            toast({
              title: "Success!",
              description: "Wallet connected successfully",
            });
          }
        } catch (dailyError: any) {
          // Don't show error for daily entry failure, just show wallet connection success
          toast({
            title: "Success!",
            description: "Wallet connected successfully",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Connection Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, toast]);

  const disconnect = useCallback(async () => {
    try {
      // Remove listeners BEFORE clearing the selectedWalletId
      removeWalletListeners(selectedWalletId || undefined);
      
      // Clear local state
      setAddress(null);
      setIsConnected(false);
      setSelectedWalletId(null);
      
      // Try to disconnect from MetaMask if available
      if (window.ethereum?.disconnect) {
        await window.ethereum.disconnect();
      }
      
      // Clear any stored connection data
      if (window.ethereum?.selectedAddress) {
        // Some wallets support this method
        try {
          await window.ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }]
          });
        } catch (error) {
          // Ignore permission errors, they're expected
        }
      }
      
      toast({
        title: "Disconnected",
        description: "Wallet connection has been closed",
      });
    } catch (error) {
      // Even if disconnect fails, clear local state
      removeWalletListeners(selectedWalletId || undefined);
      setAddress(null);
      setIsConnected(false);
      setSelectedWalletId(null);
      
      toast({
        title: "Disconnected",
        description: "Wallet connection cleared locally",
      });
    }
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

    onAccountsChanged(handleAccountsChanged, selectedWalletId || undefined);
    onChainChanged(handleChainChanged, selectedWalletId || undefined);

    return () => {
      removeWalletListeners(selectedWalletId || undefined);
    };
  }, [address, disconnect, checkConnection, selectedWalletId]);

  // Get provider - supports both MetaMask and WalletConnect
  const getProvider = useCallback(() => {
    if (typeof window.ethereum !== 'undefined') {
      return window.ethereum;
    }
    return null;
  }, []);

  // Network verification functions
  const checkNetwork = useCallback(async (): Promise<boolean> => {
    try {
      return await verifyNetwork();
    } catch (error) {
      console.error('Network check error:', error);
      return false;
    }
  }, []);

  const switchToMainnet = useCallback(async (): Promise<boolean> => {
    try {
      const switched = await switchToEthereumMainnet();
      if (switched) {
        toast({
          title: "Network Switched",
          description: "Successfully switched to Ethereum Mainnet",
        });
      }
      return switched;
    } catch (error: any) {
      toast({
        title: "Network Switch Failed",
        description: error.message || "Failed to switch to Ethereum Mainnet",
        variant: "destructive",
      });
      return false;
    }
  }, [selectedWalletId, toast]);

  return {
    isConnected,
    address,
    isConnecting,
    isInitialized,
    connect,
    disconnect,
    getProvider,
    checkNetwork,
    switchToMainnet,
  };
}
