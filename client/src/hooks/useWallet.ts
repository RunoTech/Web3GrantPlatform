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

  // Simple connection check - NO POPUPS, NO SIGNATURES
  const checkConnection = useCallback(async () => {
    try {
      console.log("🔍 Simple MetaMask check...");
      
      if (!window.ethereum) {
        console.log("❌ MetaMask not found");
        setIsInitialized(true);
        return;
      }

      // ONLY use eth_accounts - this is silent and safe
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts'
      });
      
      console.log("🔍 Accounts:", accounts);
      
      if (accounts && accounts.length > 0) {
        console.log("✅ Account found:", accounts[0]);
        setAddress(accounts[0]);
        setIsConnected(true);
        await checkAuthToken();
      } else {
        console.log("❌ No accounts");
        setAddress(null);
        setIsConnected(false);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Connection check error:', error);
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
      const networkResult = await verifyNetwork();
      if (!networkResult.isCorrect) {
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
      console.error('Logout error:', error);
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