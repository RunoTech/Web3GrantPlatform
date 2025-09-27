import { createConfig, http } from 'wagmi';
import { mainnet, bsc } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';

// Create Wagmi config with Ethereum and BSC support
export const wagmiConfig = createConfig({
  chains: [mainnet, bsc],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
  },
});