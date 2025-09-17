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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  // Check authentication token on initialization
  const checkAuthToken = useCallback(() => {
    const token = localStorage.getItem('duxxan_auth_token');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      const accounts = await getAccounts();
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        // Only auto-set wallet ID if not already set (on initial load)
        if (!selectedWalletId) {
          setSelectedWalletId('metamask');
        }
        // Check authentication token
        checkAuthToken();
      } else {
        setAddress(null);
        setIsConnected(false);
        setIsAuthenticated(false);
        setAuthToken(null);
        localStorage.removeItem('duxxan_auth_token');
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      setAddress(null);
      setIsConnected(false);
      setIsAuthenticated(false);
      setAuthToken(null);
    } finally {
      setIsInitialized(true);
    }
  }, [selectedWalletId, checkAuthToken]);

  // Get provider - supports both MetaMask and WalletConnect
  const getProvider = useCallback(() => {
    if (typeof window.ethereum !== 'undefined') {
      return window.ethereum;
    }
    return null;
  }, []);

  // SIWE Authentication Flow
  const authenticate = useCallback(async (walletAddress: string): Promise<boolean> => {
    if (isAuthenticating) return false;
    
    setIsAuthenticating(true);
    try {
      // Step 1: Get nonce from server
      const nonceResponse = await apiRequest("POST", "/auth/nonce", {
        wallet: walletAddress
      }) as any;
      
      if (!nonceResponse.nonce || !nonceResponse.message) {
        throw new Error("Failed to get authentication nonce");
      }

      // Step 2: Sign the message with MetaMask
      const provider = getProvider();
      if (!provider) {
        throw new Error("Wallet provider not available");
      }

      const signature = await provider.request({
        method: 'personal_sign',
        params: [nonceResponse.message, walletAddress],
      });

      // Step 3: Verify signature on server
      const verifyResponse = await apiRequest("POST", "/auth/verify", {
        wallet: walletAddress,
        signature: signature,
        nonce: nonceResponse.nonce
      }) as any;

      if (!verifyResponse.success || !verifyResponse.token) {
        throw new Error("Authentication verification failed");
      }

      // Step 4: Store JWT token
      localStorage.setItem('duxxan_auth_token', verifyResponse.token);
      setAuthToken(verifyResponse.token);
      setIsAuthenticated(true);

      toast({
        title: "Authenticated Successfully",
        description: "Wallet signature verified - you're now authenticated",
      });

      return true;
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Failed to authenticate wallet",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating, getProvider, toast]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call server logout if authenticated
      if (authToken) {
        await apiRequest("POST", "/auth/logout", {});
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if server call fails
    }

    // Clear local state
    localStorage.removeItem('duxxan_auth_token');
    setAuthToken(null);
    setIsAuthenticated(false);
    
    toast({
      title: "Logged Out",
      description: "Authentication session ended",
    });
  }, [authToken, toast]);

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
        setSelectedWalletId(selectedWalletId || 'metamask');
        
        // Step 2: Authenticate the wallet with SIWE
        const authSuccess = await authenticate(connectedAddress);
        
        if (authSuccess) {
          // Step 3: Auto participate in daily reward if authenticated
          try {
            const dailyResponse = await apiRequest("POST", "/api/auto-daily-entry", {
              wallet: connectedAddress
            });
            
            if ((dailyResponse as any).success) {
              toast({
                title: "Success!",
                description: "Wallet connected, authenticated & auto-entered daily reward draw",
              });
            } else {
              toast({
                title: "Success!",
                description: "Wallet connected & authenticated successfully",
              });
            }
          } catch (dailyError: any) {
            // Don't show error for daily entry failure, just show connection success
            toast({
              title: "Success!",
              description: "Wallet connected & authenticated successfully",
            });
          }
        } else {
          toast({
            title: "Partial Success",
            description: "Wallet connected but authentication failed. Some features may be limited.",
            variant: "destructive",
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
      
      // For most wallets, there's no programmatic disconnect
      // Just clear local state - user can disconnect from wallet itself if needed
      
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
  }, [selectedWalletId, toast]);

  // Initial connection check - only on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Wallet event listeners - separate from connection check  
  useEffect(() => {
    if (!selectedWalletId) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
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
  }, [selectedWalletId, address, disconnect]);

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
    isAuthenticated,
    isAuthenticating,
    authToken,
    connect,
    disconnect,
    authenticate,
    logout,
    getProvider,
    checkNetwork,
    switchToMainnet,
  };
}
