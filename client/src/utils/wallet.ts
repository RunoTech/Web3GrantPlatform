declare global {
  interface Window {
    ethereum?: any;
    trustwallet?: any;
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
export function getWalletProvider(): any {
  // Priority order: Trust Wallet, then MetaMask, then generic ethereum
  if (typeof window !== 'undefined') {
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

// Get the current wallet name for display purposes
export function getWalletName(): string {
  if (typeof window !== 'undefined') {
    if (window.trustwallet?.ethereum || window.ethereum?.isTrustWallet) {
      return 'Trust Wallet';
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

export async function verifyNetwork(): Promise<boolean> {
  const provider = getWalletProvider();
  if (!provider) {
    return false;
  }

  try {
    const chainId = await provider.request({
      method: 'eth_chainId',
    });
    
    return chainId === ETHEREUM_MAINNET_CHAIN_ID;
  } catch (error) {
    console.error('Network verification error:', error);
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
    console.error('Network switch error:', error);
    return false;
  }
}

export async function connectWallet(): Promise<string | null> {
  // Check for various wallet providers
  const provider = getWalletProvider();
  if (!provider) {
    throw new Error('No wallet found. Please install MetaMask, Trust Wallet, or another compatible wallet.');
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

export async function getAccounts(): Promise<string[]> {
  const provider = getWalletProvider();
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
