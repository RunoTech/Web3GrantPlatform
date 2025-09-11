export const networks = {
  ethereum: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: process.env.ETH_RPC_URL || 'https://eth.llamarpc.com',
    platformWallet: process.env.PLATFORM_WALLET_ETH || '',
  }
};

// ERC20 ABI for token transfers
export const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];
