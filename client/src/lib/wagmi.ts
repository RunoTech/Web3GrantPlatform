import { createConfig, http } from 'wagmi';
import { mainnet, bsc } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Create Wagmi config with Ethereum and BSC support
// Using injected() instead of metaMask() to avoid SDK analytics errors
export const wagmiConfig = createConfig({
  chains: [mainnet, bsc],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
  },
});