// Use EthereumProvider interface from useWallet hook to avoid type conflicts

export interface WalletProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
}

// Security: Ethereum Mainnet Chain ID
const ETHEREUM_MAINNET_CHAIN_ID = '0x1'; // Chain ID 1

// Get MetaMask provider only
export function getWalletProvider(): any {
  if (typeof window !== 'undefined' && window.ethereum) {
    // Log only in development
    if (import.meta.env.DEV) {
      console.log('🦊 MetaMask detected');
    }
    return window.ethereum;
  }
  
  // Log only in development
  if (import.meta.env.DEV) {
    console.warn('⚠️ MetaMask not detected');
  }
  return null;
}



// Get the current wallet name for display purposes
export function getWalletName(): string {
  if (typeof window !== 'undefined' && window.ethereum) {
    return 'MetaMask';
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

// SECURITY: Check if wallet is actually unlocked and accessible
export async function isWalletUnlockedAndAccessible(): Promise<boolean> {
  const provider = getWalletProvider();
  if (!provider) {
    if (import.meta.env.DEV) {
      console.log('🔒 Wallet accessibility check: FAILED (no provider)');
    }
    return false;
  }

  try {
    // First check if this is MetaMask and use its native unlock check
    if (provider.isMetaMask && provider._metamask?.isUnlocked) {
      const isUnlocked = await provider._metamask.isUnlocked();
      if (import.meta.env.DEV) {
        console.log(`🔒🔓 MetaMask unlock check: ${isUnlocked ? 'UNLOCKED' : 'LOCKED'}`);
      }
      return isUnlocked;
    }

    // Fallback: Check if wallet has accessible accounts (for non-MetaMask providers)
    const accounts = await provider.request({
      method: 'eth_accounts'
    });
    
    const hasAccounts = Array.isArray(accounts) && accounts.length > 0;
    
    if (import.meta.env.DEV) {
      console.log(`🔑 Fallback unlock check: ${hasAccounts ? 'HAS ACCOUNTS' : 'NO ACCOUNTS'}`);
    }
    
    return hasAccounts;
  } catch (error) {
    // Wallet is locked or not accessible
    if (import.meta.env.DEV) {
      console.log('🔒 Wallet accessibility check: FAILED (error during check)', error);
    }
    return false;
  }
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
    // Log error only in development
    if (import.meta.env.DEV) {
      console.error('ChainId normalization error:', error);
    }
    return null;
  }
}

export async function verifyNetwork(): Promise<boolean> {
  // Test environment bypass
  if (import.meta.env.VITE_BYPASS_NETWORK_CHECK === 'true') {
    // Log bypass only in development
    if (import.meta.env.DEV) {
      console.log('🧪 Network verification bypassed for testing');
    }
    return true;
  }

  const provider = getWalletProvider();
  if (!provider) {
    return false;
  }

  try {
    const rawChainId = await provider.request({
      method: 'eth_chainId',
    });
    
    const normalizedChainId = normalizeChainId(rawChainId);
    // Log network verification only in development
    if (import.meta.env.DEV) {
      console.log('🔗 Network verification:', { raw: rawChainId, normalized: normalizedChainId, expected: ETHEREUM_MAINNET_CHAIN_ID });
    }
    
    return normalizedChainId === ETHEREUM_MAINNET_CHAIN_ID;
  } catch (error) {
    // Log error only in development
    if (import.meta.env.DEV) {
      console.error('Network verification error:', error);
    }
    return false;
  }
}

export async function switchToEthereumMainnet(): Promise<boolean> {
  const provider = getWalletProvider();
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
    // Log error only in development
    if (import.meta.env.DEV) {
      console.error('Network switch error:', error);
    }
    return false;
  }
}

export async function connectWallet(): Promise<string | null> {
  // Check for MetaMask provider
  const provider = getWalletProvider();
  if (!provider) {
    throw new Error('MetaMask not found. Please install MetaMask.');
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

    // Check if already connected to show appropriate UI feedback
    const existingAccounts = await provider.request({
      method: 'eth_accounts',
    });
    
    const isAlreadyConnected = existingAccounts.length > 0;
    
    // Request account access (will show popup only if not already authorized)
    const accounts = await provider.request({
      method: isAlreadyConnected ? 'wallet_requestPermissions' : 'eth_requestAccounts',
      params: isAlreadyConnected ? [{ eth_accounts: {} }] : undefined,
    }).then(() => provider.request({ method: 'eth_accounts' }));

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
    // Log error only in development
    if (import.meta.env.DEV) {
      console.error('Wallet connection error:', error);
    }
    throw new Error(error.message || 'Error occurred while connecting wallet');
  }
}

export async function getAccounts(): Promise<string[]> {
  const provider = getWalletProvider();
  if (!provider) {
    return [];
  }

  try {
    const accounts = await provider.request({
      method: 'eth_accounts',
    });
    return Array.isArray(accounts) ? accounts : [];
  } catch (error) {
    // Log error only in development
    if (import.meta.env.DEV) {
      console.error('Error getting accounts:', error);
    }
    return [];
  }
}

export function onAccountsChanged(callback: (accounts: string[]) => void) {
  const provider = getWalletProvider();
  if (provider) {
    provider.on('accountsChanged', callback);
  }
}

export function onChainChanged(callback: (chainId: string) => void) {
  const provider = getWalletProvider();
  if (provider) {
    provider.on('chainChanged', callback);
  }
}

export function removeWalletListeners() {
  const provider = getWalletProvider();
  if (provider && typeof provider.removeAllListeners === 'function') {
    provider.removeAllListeners('accountsChanged');
    provider.removeAllListeners('chainChanged');
  }
}
