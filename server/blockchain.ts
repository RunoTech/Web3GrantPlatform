import { ethers } from "ethers";

// Network configurations
export const networks = {
  ethereum: {
    name: "Ethereum Mainnet",
    chainId: 1,
    rpcUrl: process.env.ETH_RPC_URL || "https://eth.llamarpc.com",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  bsc: {
    name: "BSC Mainnet", 
    chainId: 56,
    rpcUrl: process.env.BSC_RPC_URL || "https://bsc.llamarpc.com",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  }
};

// ERC-20 Token ABI for balance and transfer checks
export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Platform wallet addresses (from settings)
export const PLATFORM_WALLETS = {
  ethereum: "0x742d35Cc6734C0532925a3b8D4037D4D40DA5F1e",
  bsc: "0x742d35Cc6734C0532925a3b8D4037D4D40DA5F1e"
};

// Token addresses
export const TOKENS = {
  ethereum: {
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
  },
  bsc: {
    BUSD: "0xe9e7cea3dedca5984780bafc599bd69add087d56"
  }
};

/**
 * Verify a payment transaction
 */
export async function verifyPayment(
  network: string,
  txHash: string,
  expectedAmount: string,
  tokenAddress: string,
  platformWallet: string
): Promise<{
  success: boolean;
  error?: string;
  amount?: string;
  from?: string;
  to?: string;
}> {
  try {
    if (!networks[network as keyof typeof networks]) {
      return { success: false, error: "Unsupported network" };
    }

    const provider = new ethers.JsonRpcProvider(networks[network as keyof typeof networks].rpcUrl);
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return { success: false, error: "Transaction not found" };
    }

    if (!receipt.status) {
      return { success: false, error: "Transaction failed" };
    }

    // Get transaction details
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      return { success: false, error: "Transaction details not found" };
    }

    // For ERC-20 tokens, check transfer events in logs
    if (tokenAddress && tokenAddress !== "0x0000000000000000000000000000000000000000") {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      // Find Transfer event in logs
      const transferEvent = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          return parsed && parsed.name === "Transfer" && 
                 parsed.args.to.toLowerCase() === platformWallet.toLowerCase();
        } catch (e) {
          return false;
        }
      });

      if (!transferEvent) {
        return { success: false, error: "No valid transfer to platform wallet found" };
      }

      const parsed = contract.interface.parseLog({
        topics: transferEvent.topics,
        data: transferEvent.data
      });

      if (!parsed) {
        return { success: false, error: "Failed to parse transfer event" };
      }

      const transferAmount = parsed.args.value.toString();
      const decimals = await contract.decimals();
      const formattedAmount = ethers.formatUnits(transferAmount, decimals);
      
      // Check if amount matches expected amount (with small tolerance for gas)
      const expected = parseFloat(expectedAmount);
      const actual = parseFloat(formattedAmount);
      
      if (actual < expected * 0.99) { // 1% tolerance
        return { 
          success: false, 
          error: `Amount mismatch. Expected: ${expectedAmount}, Received: ${formattedAmount}` 
        };
      }

      return {
        success: true,
        amount: formattedAmount,
        from: parsed.args.from,
        to: parsed.args.to
      };
    }

    // For native token transfers
    if (tx.to?.toLowerCase() !== platformWallet.toLowerCase()) {
      return { success: false, error: "Payment not sent to platform wallet" };
    }

    const amount = ethers.formatEther(tx.value);
    const expected = parseFloat(expectedAmount);
    const actual = parseFloat(amount);
    
    if (actual < expected * 0.99) { // 1% tolerance
      return { 
        success: false, 
        error: `Amount mismatch. Expected: ${expectedAmount}, Received: ${amount}` 
      };
    }

    return {
      success: true,
      amount,
      from: tx.from,
      to: tx.to
    };

  } catch (error) {
    console.error("Payment verification error:", error);
    return { 
      success: false, 
      error: "Failed to verify transaction" 
    };
  }
}

/**
 * Get current gas prices for network
 */
export async function getGasPrices(network: string) {
  try {
    const provider = new ethers.JsonRpcProvider(networks[network as keyof typeof networks].rpcUrl);
    const feeData = await provider.getFeeData();
    
    return {
      gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") : null,
      maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, "gwei") : null,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei") : null
    };
  } catch (error) {
    console.error("Failed to get gas prices:", error);
    return null;
  }
}