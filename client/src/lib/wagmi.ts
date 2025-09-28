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
    [mainnet.id]: http(undefined, {
      pollingInterval: 15000, // 15 seconds to reduce batch flooding
    }),
    [bsc.id]: http(undefined, {
      pollingInterval: 15000, // 15 seconds to reduce batch flooding
    }),
  },
});