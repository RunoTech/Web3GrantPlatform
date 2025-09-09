declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
}

// Security: Ethereum Mainnet Chain ID
const ETHEREUM_MAINNET_CHAIN_ID = '0x1'; // Chain ID 1

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
  if (typeof window.ethereum === 'undefined') {
    return false;
  }

  try {
    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    });
    
    return chainId === ETHEREUM_MAINNET_CHAIN_ID;
  } catch (error) {
    console.error('Network verification error:', error);
    return false;
  }
}

export async function switchToEthereumMainnet(): Promise<boolean> {
  if (typeof window.ethereum === 'undefined') {
    return false;
  }

  try {
    await window.ethereum.request({
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
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask or compatible wallet not found. Please install MetaMask.');
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
    const accounts = await window.ethereum.request({
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
  if (typeof window.ethereum === 'undefined') {
    return [];
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });
    return accounts;
  } catch (error) {
    console.error('Error getting accounts:', error);
    return [];
  }
}

export function onAccountsChanged(callback: (accounts: string[]) => void) {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', callback);
  }
}

export function onChainChanged(callback: (chainId: string) => void) {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('chainChanged', callback);
  }
}

export function removeWalletListeners() {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');
  }
}
