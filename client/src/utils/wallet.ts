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

export async function connectWallet(): Promise<string | null> {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask veya uyumlu bir cüzdan bulunamadı');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (accounts.length === 0) {
      throw new Error('Cüzdan bağlantısı reddedildi');
    }

    return accounts[0];
  } catch (error: any) {
    console.error('Wallet connection error:', error);
    throw new Error(error.message || 'Cüzdan bağlanırken hata oluştu');
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
