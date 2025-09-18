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

  // SECURITY FIX: Check authentication by testing server endpoint (cookies sent automatically)
  const checkAuthToken = useCallback(async () => {
    try {
      // Try to make an authenticated request - if it succeeds, we're authenticated
      const response = await apiRequest("GET", "/auth/status");
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          // Note: No token storage needed - httpOnly cookies handle authentication
        }
      }
    } catch (error) {
      // Not authenticated or network error
      setIsAuthenticated(false);
      setAuthToken(null);
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
        // Check authentication status
        await checkAuthToken();
      } else {
        setAddress(null);
        setIsConnected(false);
        setIsAuthenticated(false);
        setAuthToken(null);
        // SECURITY FIX: No localStorage cleanup needed - httpOnly cookies managed by server
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

      if (!verifyResponse.success) {
        throw new Error("Authentication verification failed");
      }

      // SECURITY FIX: No JWT token storage needed - httpOnly cookies handle authentication
      // Server sets httpOnly cookie automatically in /auth/verify endpoint
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
      // SECURITY FIX: Always call server logout when authenticated (no authToken dependency)
      if (isAuthenticated) {
        await apiRequest("POST", "/auth/logout", {});
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if server call fails
    }

    // Clear local authentication state
    setIsAuthenticated(false);
    setAuthToken(null);
    
    // SECURITY FIX: Refresh auth status from server to ensure consistency
    try {
      await checkAuthToken();
    } catch (error) {
      // If check fails, ensure we're marked as not authenticated
      setIsAuthenticated(false);
    }
    
    toast({
      title: "Logged Out",
      description: "Authentication session ended",
    });
  }, [isAuthenticated, checkAuthToken, toast]);

  const connect = useCallback(async (selectedWalletId?: string) => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      const connectedAddress = await connectWallet(selectedWalletId);
      if (connectedAddress) {
        setAddress(connectedAddress);
        setIsConnected(true);
        setSelectedWalletId(selectedWalletId || 'metamask');
        
        // SECURITY FIX: Authenticate FIRST, then create account
        // Step 1: Authenticate the wallet with SIWE
        const authSuccess = await authenticate(connectedAddress);
        
        if (authSuccess) {
          // Step 2: Create account after authentication (now secure)
          const referralCode = localStorage.getItem('referralCode');
          
          try {
            if (referralCode) {
              // Create account with referral using authenticated endpoint
              await apiRequest("POST", "/api/register-with-referral", {
                referralCode: referralCode, // wallet is taken from authenticated session
              });
              // Clear referral code after successful registration
              localStorage.removeItem('referralCode');
            } else {
              // Create regular account using authenticated endpoint
              await apiRequest("POST", "/api/create-account", {
                // wallet is taken from authenticated session
              });
            }
          } catch (error: any) {
            // Account might already exist, which is fine
            console.log("Account creation note:", error);
          }
          
          // Step 3: Auto participate in daily reward
          try {
            const dailyResponse = await apiRequest("POST", "/api/auto-daily-entry", {
              wallet: connectedAddress // This endpoint validates wallet matches authenticated user
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
            title: "Connection Failed",
            description: "Wallet connected but authentication failed. Please try again.",
            variant: "destructive",
          });
          // Clear connection state if authentication fails
          setAddress(null);
          setIsConnected(false);
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
