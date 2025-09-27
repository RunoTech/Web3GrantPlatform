import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useToast } from '@/hooks/use-toast';

export function useWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { toast } = useToast();

  // Simple connect function - Web3Modal handles everything
  const connectWallet = async (): Promise<boolean> => {
    try {
      // Get MetaMask connector (most reliable)
      const metamaskConnector = connectors.find(connector => 
        connector.name.toLowerCase().includes('metamask') || 
        connector.id === 'injected'
      );

      if (!metamaskConnector) {
        toast({
          title: "MetaMask Bulunamadı",
          description: "Lütfen MetaMask uzantısını yükleyin",
          variant: "destructive"
        });
        return false;
      }

      // Connect with MetaMask
      connect({ connector: metamaskConnector });
      
      return true;
    } catch (error: any) {
      console.error('Connection error:', error);
      
      let message = "Bağlantı başarısız";
      if (error.message) {
        message = error.message;
      }

      toast({
        title: "Bağlantı Hatası", 
        description: message,
        variant: "destructive"
      });

      return false;
    }
  };

  // Simple disconnect function
  const disconnectWallet = () => {
    wagmiDisconnect();
    
    toast({
      title: "Bağlantı Kesildi",
      description: "Cüzdan bağlantısı sonlandırıldı"
    });
  };

  return {
    isConnected,
    address: address || null,
    isConnecting,
    connect: connectWallet,
    disconnect: disconnectWallet
  };
}