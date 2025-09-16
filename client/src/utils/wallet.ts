declare global {
  interface Window {
    ethereum?: any;
    trustwallet?: any;
    coinbaseWalletExtension?: any;
    okxwallet?: any;
    BinanceChain?: any;
    phantom?: any;
  }
}

export interface WalletProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
}

// Security: Ethereum Mainnet Chain ID
const ETHEREUM_MAINNET_CHAIN_ID = '0x1'; // Chain ID 1

// Detect and return the appropriate wallet provider
export function getWalletProvider(selectedWalletId?: string): any {
  if (typeof window !== 'undefined') {
    // If specific wallet is requested, try to get that one first
    if (selectedWalletId) {
      const specificProvider = getSpecificWalletProvider(selectedWalletId);
      if (specificProvider) {
        return specificProvider;
      }
    }

    // Priority order: Trust Wallet, Coinbase, MetaMask, OKX, Binance, then generic
    // Check for Trust Wallet first
    if (window.trustwallet?.ethereum) {
      console.log('🛡️ Trust Wallet detected');
      return window.trustwallet.ethereum;
    }
    
    // Check if it's Trust Wallet injected as ethereum
    if (window.ethereum?.isTrustWallet) {
      console.log('🛡️ Trust Wallet detected');
      return window.ethereum;
    }
    
    // Check for Coinbase Wallet
    if (window.ethereum?.isCoinbaseWallet || window.coinbaseWalletExtension) {
      console.log('🦎 Coinbase Wallet detected');
      return window.ethereum;
    }
    
    // Check for OKX Wallet  
    if (window.ethereum?.isOkxWallet || window.okxwallet) {
      console.log('🟠 OKX Wallet detected');
      return window.okxwallet || window.ethereum;
    }
    
    // Check for Binance Wallet
    if (window.ethereum?.isBinance || window.BinanceChain) {
      console.log('🟡 Binance Wallet detected');
      return window.BinanceChain || window.ethereum;
    }
    
    // Check for Brave Wallet
    if (window.ethereum?.isBraveWallet) {
      console.log('🦁 Brave Wallet detected');
      return window.ethereum;
    }
    
    // Check for MetaMask
    if (window.ethereum?.isMetaMask) {
      console.log('🦊 MetaMask detected');
      return window.ethereum;
    }
    
    // Fall back to generic ethereum provider
    if (window.ethereum) {
      console.log('💳 Generic Ethereum provider detected');
      return window.ethereum;
    }
  }
  
  return null;
}

// Get specific wallet provider by ID
function getSpecificWalletProvider(walletId: string): any {
  if (typeof window === 'undefined') return null;
  
  switch (walletId) {
    case 'trust':
      if (window.trustwallet?.ethereum) return window.trustwallet.ethereum;
      if (window.ethereum?.isTrustWallet) return window.ethereum;
      break;
    case 'coinbase':
      if (window.ethereum?.isCoinbaseWallet) return window.ethereum;
      if (window.coinbaseWalletExtension) return window.coinbaseWalletExtension;
      break;
    case 'okx':
      if (window.okxwallet) return window.okxwallet;
      if (window.ethereum?.isOkxWallet) return window.ethereum;
      break;
    case 'binance':
      if (window.BinanceChain) return window.BinanceChain;
      if (window.ethereum?.isBinance) return window.ethereum;
      break;
    case 'brave':
      if (window.ethereum?.isBraveWallet) return window.ethereum;
      break;
    case 'metamask':
      if (window.ethereum?.isMetaMask) return window.ethereum;
      break;
  }
  
  return null;
}

// Get wallet display name for errors
function getWalletDisplayName(walletId: string): string {
  const names: Record<string, string> = {
    'trust': 'Trust Wallet',
    'coinbase': 'Coinbase Wallet',
    'okx': 'OKX Wallet',
    'binance': 'Binance Wallet',
    'brave': 'Brave Wallet',
    'metamask': 'MetaMask'
  };
  return names[walletId] || 'Wallet';
}

// Get the current wallet name for display purposes
export function getWalletName(): string {
  if (typeof window !== 'undefined') {
    if (window.trustwallet?.ethereum || window.ethereum?.isTrustWallet) {
      return 'Trust Wallet';
    }
    if (window.ethereum?.isCoinbaseWallet || window.coinbaseWalletExtension) {
      return 'Coinbase Wallet';
    }
    if (window.ethereum?.isOkxWallet || window.okxwallet) {
      return 'OKX Wallet';
    }
    if (window.ethereum?.isBinance || window.BinanceChain) {
      return 'Binance Wallet';
    }
    if (window.ethereum?.isBraveWallet) {
      return 'Brave Wallet';
    }
    if (window.ethereum?.isMetaMask) {
      return 'MetaMask';
    }
    if (window.ethereum) {
      return 'Ethereum Wallet';
    }
  }
  return 'Unknown';
}

export function isValidEthereumAddress(address: string): boolean {
  // Basic format check
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return false;
  }
  
  // Additional security: Check for common invalid addresses
  const invalidAddresses = [
    '0x0000000000000000000000000000000000000000', // Zero address
    '0x000000000000000000000000000000000000dead', // Burn address
  ];
  
  return !invalidAddresses.includes(address.toLowerCase());
}

// Normalize chainId to handle different provider formats
function normalizeChainId(value: any): string | null {
  try {
    if (typeof value === 'string') {
      if (value.startsWith('0x')) {
        // Hex string - normalize case and padding
        return '0x' + parseInt(value, 16).toString(16);
      } else {
        // Decimal string
        return '0x' + parseInt(value, 10).toString(16);
      }
    } else if (typeof value === 'number' || typeof value === 'bigint') {
      return '0x' + value.toString(16);
    } else if (typeof value === 'object' && value !== null) {
      // Handle object responses like {chainId: "0x1"} or {result: "0x1"}
      if (value.chainId) {
        return normalizeChainId(value.chainId);
      } else if (value.result) {
        return normalizeChainId(value.result);
      }
    }
    return null;
  } catch (error) {
    console.error('ChainId normalization error:', error);
    return null;
  }
}

export async function verifyNetwork(selectedWalletId?: string): Promise<boolean> {
  // Test environment bypass
  if (import.meta.env.VITE_BYPASS_NETWORK_CHECK === 'true') {
    console.log('🧪 Network verification bypassed for testing');
    return true;
  }

  const provider = getWalletProvider(selectedWalletId);
  if (!provider) {
    return false;
  }

  try {
    const rawChainId = await provider.request({
      method: 'eth_chainId',
    });
    
    const normalizedChainId = normalizeChainId(rawChainId);
    console.log('🔗 Network verification:', { raw: rawChainId, normalized: normalizedChainId, expected: ETHEREUM_MAINNET_CHAIN_ID });
    
    return normalizedChainId === ETHEREUM_MAINNET_CHAIN_ID;
  } catch (error) {
    console.error('Network verification error:', error);
    return false;
  }
}

export async function switchToEthereumMainnet(selectedWalletId?: string): Promise<boolean> {
  const provider = getWalletProvider(selectedWalletId);
  if (!provider) {
    return false;
  }

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ETHEREUM_MAINNET_CHAIN_ID }],
    });
    return true;
  } catch (error: any) {
    console.error('Network switch error:', error);
    return false;
  }
}

export async function connectWallet(selectedWalletId?: string): Promise<string | null> {
  // Check for various wallet providers
  const provider = getWalletProvider(selectedWalletId);
  if (!provider) {
    const walletName = selectedWalletId ? getWalletDisplayName(selectedWalletId) : 'wallet';
    throw new Error(`${walletName} not found. Please install it or choose another wallet.`);
  }

  try {
    // Security Check 1: Verify network first
    const isCorrectNetwork = await verifyNetwork();
    if (!isCorrectNetwork) {
      const switched = await switchToEthereumMainnet();
      if (!switched) {
        throw new Error('Please switch to Ethereum Mainnet to continue.');
      }
    }

    // Request account access
    const accounts = await provider.request({
      method: 'eth_requestAccounts',
    });

    if (accounts.length === 0) {
      throw new Error('Wallet connection was rejected. Please approve the connection request.');
    }

    const address = accounts[0];

    // Security Check 2: Validate address format
    if (!isValidEthereumAddress(address)) {
      throw new Error('Invalid wallet address format. Please check your wallet.');
    }

    // Security Check 3: Final network verification after connection
    const networkVerified = await verifyNetwork();
    if (!networkVerified) {
      throw new Error('Network verification failed. Please ensure you are on Ethereum Mainnet.');
    }

    return address;
  } catch (error: any) {
    console.error('Wallet connection error:', error);
    throw new Error(error.message || 'Error occurred while connecting wallet');
  }
}

export async function getAccounts(selectedWalletId?: string): Promise<string[]> {
  const provider = getWalletProvider(selectedWalletId);
  if (!provider) {
    return [];
  }

  try {
    const accounts = await provider.request({
      method: 'eth_accounts',
    });
    return accounts;
  } catch (error) {
    console.error('Error getting accounts:', error);
    return [];
  }
}

export function onAccountsChanged(callback: (accounts: string[]) => void, selectedWalletId?: string) {
  const provider = getWalletProvider(selectedWalletId);
  if (provider) {
    provider.on('accountsChanged', callback);
  }
}

export function onChainChanged(callback: (chainId: string) => void, selectedWalletId?: string) {
  const provider = getWalletProvider(selectedWalletId);
  if (provider) {
    provider.on('chainChanged', callback);
  }
}

export function removeWalletListeners(selectedWalletId?: string) {
  const provider = getWalletProvider(selectedWalletId);
  if (provider && typeof provider.removeAllListeners === 'function') {
    provider.removeAllListeners('accountsChanged');
    provider.removeAllListeners('chainChanged');
  }
}
