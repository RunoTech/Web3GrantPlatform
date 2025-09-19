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
      console.log("🔍 Silent MetaMask state check başlatılıyor...");
      
      // Reset state first
      setAddress(null);
      setIsConnected(false);
      setIsAuthenticated(false);
      
      if (!window.ethereum) {
        console.log("❌ MetaMask extension bulunamadı");
        setIsInitialized(true);
        return;
      }

      try {
        // SAFE METHOD 1: Check if MetaMask is unlocked (MetaMask-specific API)
        const isUnlocked = await (window.ethereum as any)._metamask?.isUnlocked?.().catch(() => false);
        console.log("🔓 MetaMask unlocked durumu:", isUnlocked);
        
        // SAFE METHOD 2: Get accounts without triggering popup (silent check)
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts'  // SILENT - popup açmaz, sadece mevcut izinleri kontrol eder
        });
        console.log("🔍 Silent account check:", accounts);
        
        // BOTH conditions must be true for real connection
        if (isUnlocked && accounts && accounts.length > 0) {
          console.log("✅ MetaMask açık VE hesap mevcut:", accounts[0]);
          setAddress(accounts[0]);
          setIsConnected(true);
          await checkAuthToken();
        } else {
          if (!isUnlocked) {
            console.log("❌ MetaMask kilitli - kullanıcı şifre girmeli");
          } else {
            console.log("❌ MetaMask açık ama hesap izni yok");
          }
        }
      } catch (error: any) {
        console.log("❌ Silent check error:", error);
      }
    } catch (error) {
      console.error('❌ Connection check error:', error);
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

  // SIWE Authentication Flow - Fixed to not auto-trigger MetaMask
  const authenticate = useCallback(async (walletAddress: string): Promise<boolean> => {
    if (isAuthenticating) return false;
    
    console.log("🔐 Starting authentication for wallet:", walletAddress);
    
    // Don't auto-call checkConnection() - rely on current state
    if (!isConnected || !address) {
      toast({
        title: "MetaMask Bağlı Değil",
        description: "Lütfen önce MetaMask cüzdanınızı bağlayın",
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
      console.log('🚫 FORCE disconnect başlatılıyor...');
      
      // STEP 1: Server session'ını temizle
      try {
        await logout();
        console.log('✅ Server session temizlendi');
      } catch (error) {
        console.log('⚠️ Server logout error (devam ediyor):', error);
      }
      
      // STEP 2: Local state'leri tamamen temizle
      setAddress(null);
      setIsConnected(false);
      setIsAuthenticated(false);
      
      // STEP 3: LocalStorage temizle
      localStorage.removeItem('referralCode');
      localStorage.removeItem('authToken');
      localStorage.removeItem('walletConnect');
      
      console.log('🚫 FORCE disconnect tamamlandı - tüm state temizlendi');
      
      toast({
        title: "Bağlantı Kesildi",
        description: "Cüzdan bağlantısı tamamen kesildi ve temizlendi",
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      // Force state clear even if error
      setAddress(null);
      setIsConnected(false);
      setIsAuthenticated(false);
      
      toast({
        title: "Bağlantı Kesildi",
        description: "Local state zorla temizlendi",
      });
    }
  }, [logout, toast]);

  // Initial connection check - only on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Focus-based recheck for lock/unlock detection
  useEffect(() => {
    const handleWindowFocus = () => {
      console.log("🔍 Window focus - checking MetaMask state...");
      checkConnection();
    };

    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [checkConnection]);

  // MetaMask event listeners
  useEffect(() => {
    if (!window.ethereum || !isConnected) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('🔄 Accounts changed:', accounts);
      if (!accounts || accounts.length === 0) {
        // MetaMask locked or disconnected - clear all state
        console.log('🚫 MetaMask locked/disconnected - clearing state');
        setAddress(null);
        setIsConnected(false);
        setIsAuthenticated(false);
      } else if (accounts[0] !== address) {
        // Account switched - update but don't auto-authenticate
        console.log('🔄 Account switched to:', accounts[0]);
        setAddress(accounts[0]);
        setIsConnected(true);
        setIsAuthenticated(false); // Clear auth when account changes
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
