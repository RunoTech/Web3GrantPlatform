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
      console.log("🔍 Checking real-time MetaMask connection...");
      
      // Always check fresh - no cache
      if (!window.ethereum) {
        console.log("❌ MetaMask extension not found");
        setAddress(null);
        setIsConnected(false);
        setIsAuthenticated(false);
        setIsInitialized(true);
        return;
      }

      try {
        // Force fresh connection check - this will fail if MetaMask is locked/closed
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts'
        });
        
        console.log("🔍 MetaMask accounts check:", accounts);
        
        if (accounts && accounts.length > 0) {
          // Verify MetaMask is actually responsive
          try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            console.log("✅ MetaMask responsive, chain:", chainId, "account:", accounts[0]);
            
            setAddress(accounts[0]);
            setIsConnected(true);
            // Check authentication status
            await checkAuthToken();
          } catch (responseError) {
            console.log("❌ MetaMask not responsive:", responseError);
            setAddress(null);
            setIsConnected(false);
            setIsAuthenticated(false);
          }
        } else {
          console.log("❌ No accounts found - MetaMask locked or not connected");
          setAddress(null);
          setIsConnected(false);
          setIsAuthenticated(false);
        }
      } catch (accountError) {
        console.log("❌ MetaMask account check failed:", accountError);
        setAddress(null);
        setIsConnected(false);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Error checking MetaMask connection:', error);
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

  // SIWE Authentication Flow - Simplified and Fixed
  const authenticate = useCallback(async (walletAddress: string): Promise<boolean> => {
    if (isAuthenticating) return false;
    
    console.log("🔐 Starting authentication for wallet:", walletAddress);
    
    // First, force refresh MetaMask connection to make sure it's really available
    await checkConnection();
    
    if (!isConnected || !address) {
      toast({
        title: "MetaMask Not Connected",
        description: "Please connect your MetaMask wallet first",
        variant: "destructive",
      });
      return false;
    }

    setIsAuthenticating(true);
    
    const provider = getProvider();
    if (!provider) {
      setIsAuthenticating(false);
      toast({
        title: "MetaMask Not Found",
        description: "Please install and unlock MetaMask extension",
        variant: "destructive",
      });
      return false;
    }

    try {
      const checksumAddress = walletAddress.toLowerCase();
      
      // Step 1: Get nonce from server
      console.log("📝 Getting authentication nonce...");
      const nonceRes = await apiRequest("POST", "/auth/nonce", {
        wallet: checksumAddress
      });
      const nonceData = await nonceRes.json();
      console.log("✅ Nonce received:", nonceData);
      
      if (!nonceData.nonce || !nonceData.message) {
        throw new Error("Failed to get authentication nonce from server");
      }

      // Step 2: Sign message with MetaMask (user gesture must be preserved)
      console.log("🖊️ Requesting signature from MetaMask...");
      
      // Use window.ethereum directly to preserve user gesture
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [nonceData.message, checksumAddress],
      });
      
      console.log("✅ Signature received from MetaMask");
      
      if (!signature) {
        throw new Error("MetaMask signature is empty");
      }

      // Step 3: Verify signature on server
      console.log("🔍 Verifying signature with server...");
      const verifyRes = await apiRequest("POST", "/auth/verify", {
        wallet: checksumAddress,
        signature: signature,
        nonce: nonceData.nonce
      });
      
      const verifyData = await verifyRes.json();
      console.log("✅ Authentication verification:", verifyData);

      if (!verifyData.success) {
        throw new Error(verifyData.error || "Authentication verification failed");
      }

      // Success - update state
      setIsAuthenticated(true);

      toast({
        title: "Authentication Successful",
        description: "You are now authenticated with your wallet",
      });

      return true;
      
    } catch (error: any) {
      console.error('❌ Authentication error:', error);
      
      let errorMessage = "Authentication failed";
      
      // Handle MetaMask specific errors
      if (error?.code === 4001) {
        errorMessage = "İmzayı reddettiniz. Lütfen tekrar deneyin.";
      } else if (error?.code === -32002) {
        errorMessage = "MetaMask'te bekleyen bir işlem var. Lütfen MetaMask'i açın ve işlemi tamamlayın.";
      } else if (error?.code === -32603) {
        errorMessage = "MetaMask hatası. Lütfen extension'ı yenileyin ve tekrar deneyin.";
      } else if (error?.message?.includes("User rejected")) {
        errorMessage = "İmzayı reddettiniz. Kimlik doğrulaması için imzalamanız gerekiyor.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating, isConnected, address, getProvider, checkConnection, toast]);

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
