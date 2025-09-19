import { useState, useEffect, useCallback } from 'react';
import { verifyNetwork, switchToEthereumMainnet } from '@/utils/wallet';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export function useWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  // SECURITY FIX: Check authentication by testing server endpoint (cookies sent automatically)
  const checkAuthToken = useCallback(async () => {
    try {
      // Try to make an authenticated request - if it succeeds, we're authenticated
      const data = await apiRequest("GET", "/auth/status") as any;
      if (data?.authenticated) {
        setIsAuthenticated(true);
        // Note: No token storage needed - httpOnly cookies handle authentication
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      // Not authenticated or network error
      setIsAuthenticated(false);
    }
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      // Direct MetaMask connection check
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          // Check authentication status
          await checkAuthToken();
        } else {
          setAddress(null);
          setIsConnected(false);
          setIsAuthenticated(false);
        }
      } else {
        setAddress(null);
        setIsConnected(false);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking MetaMask connection:', error);
      setAddress(null);
      setIsConnected(false);
      setIsAuthenticated(false);
    } finally {
      setIsInitialized(true);
    }
  }, [checkAuthToken]);

  // Get MetaMask provider only
  const getProvider = useCallback(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      console.log('🦊 MetaMask detected');
      return window.ethereum;
    }
    console.warn('⚠️ MetaMask not detected');
    return null;
  }, []);

  // SIWE Authentication Flow
  const authenticate = useCallback(async (walletAddress: string): Promise<boolean> => {
    if (isAuthenticating) return false;
    
    setIsAuthenticating(true);
    try {
      // Step 1: Get nonce from server
      console.log("🔐 Requesting nonce for wallet:", walletAddress);
      const nonceRes = await apiRequest("POST", "/auth/nonce", {
        wallet: walletAddress
      });
      const nonceResponse = await nonceRes.json();
      console.log("✅ Nonce response:", nonceResponse);
      
      if (!nonceResponse.nonce || !nonceResponse.message) {
        throw new Error("Failed to get authentication nonce");
      }

      // Step 2: Sign the message with MetaMask
      const provider = getProvider();
      if (!provider) {
        throw new Error("Wallet provider not available");
      }

      console.log("🖊️ Requesting signature from MetaMask...");
      
      // Ensure we have a proper wallet address format
      const checksumAddress = walletAddress.toLowerCase();
      
      let signature;
      try {
        // Direct MetaMask request - no complex Promise.race
        console.log("📝 Calling personal_sign with:", {
          message: nonceResponse.message,
          address: checksumAddress
        });
        
        signature = await provider.request({
          method: 'personal_sign',
          params: [nonceResponse.message, checksumAddress],
        });
        
        console.log("✅ Signature received:", signature);
        
        if (!signature) {
          throw new Error("MetaMask returned empty signature");
        }
        
      } catch (signError: any) {
        console.error("❌ MetaMask signature error:", signError);
        console.error("❌ Error details:", JSON.stringify(signError, null, 2));
        console.error("❌ Error code:", signError?.code);
        console.error("❌ Error message:", signError?.message);
        
        // Handle specific MetaMask error codes
        if (signError?.code === 4001) {
          throw new Error("İmzayı reddettiniz. Lütfen tekrar deneyin ve imzayı onaylayın.");
        } else if (signError?.code === -32603) {
          throw new Error("MetaMask internal error. Sayfayı yenileyin ve tekrar deneyin.");
        } else if (signError?.code === -32002) {
          throw new Error("MetaMask'te bekleyen işlem var. Lütfen MetaMask'i açın ve işlemi tamamlayın.");
        } else if (!signError || Object.keys(signError).length === 0) {
          throw new Error("MetaMask yanıt vermedi. Extension'ın açık ve çalışır durumda olduğundan emin olun.");
        } else {
          throw new Error(`MetaMask hatası: ${signError?.message || signError?.toString() || 'Bilinmeyen hata'}`);
        }
      }

      // Step 3: Verify signature on server
      console.log("🔍 Sending signature to verify endpoint...");
      const verifyRes = await apiRequest("POST", "/auth/verify", {
        wallet: walletAddress,
        signature: signature,
        nonce: nonceResponse.nonce
      });
      console.log("✅ Verify response status:", verifyRes.status);
      const verifyResponse = await verifyRes.json();
      console.log("✅ Verify response data:", verifyResponse);

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

  const connect = useCallback(async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      // SECURITY FIX: Check network FIRST before any connection attempt
      console.log('🔒 Verifying Ethereum Mainnet...');
      const networkValid = await verifyNetwork();
      if (!networkValid) {
        console.log('🔄 Attempting to switch to Ethereum Mainnet...');
        const switchSuccess = await switchToEthereumMainnet();
        if (!switchSuccess) {
          throw new Error("Please switch to Ethereum Mainnet before connecting your wallet.");
        }
      }
      
      // Check if MetaMask is available
      if (!window.ethereum) {
        throw new Error("MetaMask not detected. Please install MetaMask first.");
      }
      
      console.log('🦊 Requesting MetaMask connection...');
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from MetaMask");
      }
      
      const connectedAddress = accounts[0];
      console.log('✅ MetaMask connected:', connectedAddress);
      
      // SECURITY FIX: Final network recheck after connection
      const postConnectNetworkValid = await verifyNetwork();
      if (!postConnectNetworkValid) {
        throw new Error("Network verification failed after connection. Please ensure you are on Ethereum Mainnet.");
      }
      
      setAddress(connectedAddress);
      setIsConnected(true);
      
      // SECURITY FIX: Authenticate FIRST, then create account
      // Step 1: Authenticate the wallet with SIWE
      console.log('🔐 Starting authentication...');
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
    } catch (error: any) {
      console.error('❌ MetaMask connection error:', error);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to MetaMask",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, authenticate, toast]);

  const disconnect = useCallback(async () => {
    try {
      // Clear local state
      setAddress(null);
      setIsConnected(false);
      setIsAuthenticated(false);
      
      console.log('🚫 MetaMask disconnected');
      
      toast({
        title: "Disconnected",
        description: "Wallet connection has been closed",
      });
    } catch (error) {
      // Even if disconnect fails, clear local state
      setAddress(null);
      setIsConnected(false);
      setIsAuthenticated(false);
      
      toast({
        title: "Disconnected",
        description: "Wallet connection cleared locally",
      });
    }
  }, [toast]);

  // Initial connection check - only on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // MetaMask event listeners
  useEffect(() => {
    if (!window.ethereum || !isConnected) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('🔄 Accounts changed:', accounts);
      if (!accounts || accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== address) {
        setAddress(accounts[0]);
        setIsConnected(true);
      }
    };

    const handleChainChanged = () => {
      console.log('🔗 Chain changed, reloading...');
      window.location.reload();
    };

    // Add MetaMask event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      // Remove MetaMask event listeners
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [isConnected, address, disconnect]);

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
  }, [toast]);

  return {
    isConnected,
    address,
    isConnecting,
    isInitialized,
    isAuthenticated,
    isAuthenticating,
    connect,
    disconnect,
    authenticate,
    logout,
    getProvider,
    checkNetwork,
    switchToMainnet,
  };
}
