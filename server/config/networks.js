// Import dynamic network configuration
import { getNetworkConfig, getPlatformWallets } from '../blockchain.js';

export const networks = {
  ethereum: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: process.env.ETH_RPC_URL || 'https://eth.llamarpc.com',
    platformWallet: process.env.PLATFORM_WALLET_ETH || '',
  }
};

// Function to get dynamic networks from database
export async function getDynamicNetworks() {
  try {
    const networkConfig = await getNetworkConfig();
    const platformWallets = await getPlatformWallets();
    
    return {
      ethereum: {
        name: networkConfig.ethereum.name,
        chainId: networkConfig.ethereum.chainId,
        rpcUrl: networkConfig.ethereum.rpcUrl,
        platformWallet: platformWallets.ethereum || process.env.PLATFORM_WALLET_ETH || '',
      },
      bsc: networkConfig.bsc ? {
        name: networkConfig.bsc.name,
        chainId: networkConfig.bsc.chainId,
        rpcUrl: networkConfig.bsc.rpcUrl,
        platformWallet: platformWallets.bsc || process.env.PLATFORM_WALLET_BSC || '',
      } : undefined
    };
  } catch (error) {
    console.warn('Failed to get dynamic networks, using fallback:', error);
    return networks;
  }
}

// ERC20 ABI for token transfers
export const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];
