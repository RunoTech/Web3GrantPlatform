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

  // Check authentication status
  const checkAuthToken = useCallback(async () => {
    try {
      const data = await apiRequest("GET", "/auth/status") as any;
      if (data?.authenticated) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    }
  }, []);

  // REAL connection check - Test actual wallet capability
  const checkConnection = useCallback(async () => {
    try {
      console.log("🔍 REAL MetaMask check - testing wallet capability...");
      
      if (!window.ethereum) {
        console.log("❌ MetaMask not found");
        setAddress(null);
        setIsConnected(false);
        setIsAuthenticated(false);
        setIsInitialized(true);
        return;
      }

      // Step 1: Clear any cached connection state
      localStorage.removeItem('walletconnect');
      localStorage.removeItem('WEB3_CONNECT_CACHED_PROVIDER');
      
      // Step 2: Use eth_requestAccounts - this WILL test real connectivity
      console.log("🧪 Testing real wallet access with eth_requestAccounts...");
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts'
      });
      
      console.log("🔍 Real accounts result:", accounts);
      
      if (!accounts || accounts.length === 0) {
        console.log("❌ No accounts available - wallet locked or disconnected");
        setAddress(null);
        setIsConnected(false);
        setIsAuthenticated(false);
        setIsInitialized(true);
        return;
      }

      // Step 3: Test signature capability to verify wallet is really unlocked
      console.log("🧪 Testing signature capability...");
      try {
        const testMessage = `DUXXAN Authentication Test - ${Date.now()}`;
        
        // Create a race: signature vs short timeout
        const signPromise = window.ethereum.request({
          method: 'personal_sign',
          params: [testMessage, accounts[0]],
        });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('WALLET_LOCKED_TIMEOUT')), 2000)
        );
        
        await Promise.race([signPromise, timeoutPromise]);
        
        // If we get here, wallet is truly unlocked and capable
        console.log("✅ WALLET TRULY UNLOCKED:", accounts[0]);
        setAddress(accounts[0]);
        setIsConnected(true);
        await checkAuthToken();
        
      } catch (signError: any) {
        console.log("❌ Signature test failed:", signError.message);
        
        if (signError.message === 'WALLET_LOCKED_TIMEOUT') {
          console.log("❌ WALLET IS LOCKED - no signature capability");
        } else if (signError.code === 4001) {
          console.log("❌ User rejected signature - probably locked");
        } else {
          console.log("❌ Other signature error - wallet issues");
        }
        
        // Wallet exists but can't sign = locked or broken
        setAddress(null);
        setIsConnected(false);
        setIsAuthenticated(false);
      }
      
    } catch (error: any) {
      console.log("❌ Connection check error:", error.message);
      if (error.code === 4001) {
        console.log("❌ User rejected connection request");
      } else {
        console.log("❌ MetaMask connection failed");
      }
      setAddress(null);
      setIsConnected(false);
      setIsAuthenticated(false);
    } finally {
      setIsInitialized(true);
    }
  }, [checkAuthToken]);

  // Connect function - ONLY called by user click
  const connect = useCallback(async (): Promise<boolean> => {
    if (isConnecting) return false;
    
    setIsConnecting(true);
    try {
      console.log('🦊 User requested MetaMask connection...');
      
      if (!window.ethereum) {
        throw new Error("MetaMask bulunamadı. Lütfen MetaMask extension'ını yükleyin.");
      }

      // Check network first
      const isCorrectNetwork = await verifyNetwork();
      if (!isCorrectNetwork) {
        const switched = await switchToEthereumMainnet();
        if (!switched) {
          throw new Error("Lütfen Ethereum Mainnet'e geçin.");
        }
      }

      // Request connection - this WILL open MetaMask
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts?.length > 0) {
        console.log('✅ Connected:', accounts[0]);
        setAddress(accounts[0]);
        setIsConnected(true);
        
        toast({
          title: "Bağlandı",
          description: `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
        
        return true;
      } else {
        throw new Error('Hesap bulunamadı');
      }
    } catch (error: any) {
      console.error('❌ Connection error:', error);
      
      let errorMessage = "Bağlantı başarısız";
      if (error?.code === 4001) {
        errorMessage = "Bağlantı reddedildi";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Bağlantı Hatası",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, toast]);

  // Simple authentication
  const authenticate = useCallback(async (walletAddress: string): Promise<boolean> => {
    if (isAuthenticating) return false;
    
    setIsAuthenticating(true);
    try {
      console.log("🔐 Authentication starting...");
      
      if (!isConnected || !address) {
        throw new Error("Lütfen önce MetaMask'i bağlayın");
      }

      // Step 1: Get nonce
      const nonceRes = await apiRequest("POST", "/auth/nonce", {
        wallet: walletAddress.toLowerCase()
      });
      const nonceData = await nonceRes.json();
      
      if (!nonceData.nonce || !nonceData.message) {
        throw new Error("Nonce alınamadı");
      }

      // Step 2: Sign message
      console.log("🖊️ Signature request...");
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [nonceData.message, walletAddress.toLowerCase()],
      });

      if (!signature) {
        throw new Error("İmza alınamadı");
      }

      // Step 3: Verify
      const verifyRes = await apiRequest("POST", "/auth/verify", {
        wallet: walletAddress.toLowerCase(),
        signature: signature,
        nonce: nonceData.nonce
      });
      
      const verifyData = await verifyRes.json();
      
      if (!verifyData.success) {
        throw new Error("Kimlik doğrulama başarısız");
      }

      setIsAuthenticated(true);
      toast({
        title: "Kimlik Doğrulandı",
        description: "Başarıyla giriş yaptınız",
      });

      return true;
      
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      let errorMessage = "Kimlik doğrulama başarısız";
      if (error?.code === 4001) {
        errorMessage = "İmzayı reddettiniz";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Kimlik Doğrulama Hatası",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating, isConnected, address, toast]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await apiRequest("POST", "/auth/logout", {});
    } catch (error) {
      // Silent logout error - don't spam console
      console.log('🔓 Logout completed (server error ignored)');
    }
    
    setIsAuthenticated(false);
    toast({
      title: "Çıkış Yapıldı", 
      description: "Kimlik doğrulama sonlandırıldı",
    });
  }, [toast]);

  // Disconnect
  const disconnect = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.log('Logout error during disconnect:', error);
    }
    
    setAddress(null);
    setIsConnected(false);
    setIsAuthenticated(false);
    
    toast({
      title: "Bağlantı Kesildi",
      description: "MetaMask bağlantısı sonlandırıldı",
    });
  }, [logout, toast]);

  // Initialize on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // MetaMask event listeners
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('🔄 Accounts changed:', accounts);
      if (!accounts || accounts.length === 0) {
        setAddress(null);
        setIsConnected(false);
        setIsAuthenticated(false);
      } else if (accounts[0] !== address) {
        setAddress(accounts[0]);
        setIsConnected(true);
        setIsAuthenticated(false);
      }
    };

    const handleChainChanged = () => {
      console.log('🔗 Chain changed - reloading...');
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
  }, [address]);

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
    checkConnection,
    checkAuthToken
  };
}