import { ethers } from "ethers";

// Network configurations - Only Ethereum Mainnet
export const networks = {
  ethereum: {
    name: "Ethereum Mainnet",
    chainId: 1,
    rpcUrl: process.env.ETH_RPC_URL || "https://eth.llamarpc.com",
    wsUrl: process.env.ETH_WS_URL || "wss://ethereum-rpc.publicnode.com",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
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

// Platform wallet addresses (from database settings)
export const PLATFORM_WALLETS = {
  ethereum: "0x742d35Cc6734C0532925a3b8D4037D4D40DA5F1E"
};

// Token addresses - Only Ethereum USDT
export const TOKENS = {
  ethereum: {
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
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

/**
 * Test RPC connection
 */
export async function testRpcConnection() {
  try {
    const provider = new ethers.JsonRpcProvider(networks.ethereum.rpcUrl);
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Ethereum RPC connected. Latest block: ${blockNumber}`);
    return { success: true, blockNumber };
  } catch (error) {
    console.error("❌ RPC connection failed:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Real-time wallet listener using WebSocket
 */
export async function startWalletListener(platformWallet: string, onPaymentReceived: (payment: any) => void) {
  try {
    const checksummedWallet = ethers.getAddress(platformWallet);
    console.log(`🔍 Starting real-time wallet listener for: ${checksummedWallet}`);
    
    // Try WebSocket first for real-time monitoring
    let provider;
    try {
      provider = new ethers.WebSocketProvider(networks.ethereum.wsUrl);
      console.log(`🌐 Connected via WebSocket: ${networks.ethereum.wsUrl}`);
    } catch (wsError) {
      console.warn("WebSocket failed, falling back to HTTP RPC");
      provider = new ethers.JsonRpcProvider(networks.ethereum.rpcUrl);
    }
    
    const usdtContract = new ethers.Contract(TOKENS.ethereum.USDT, ERC20_ABI, provider);
    
    // Listen for USDT transfers TO platform wallet
    const transferFilter = usdtContract.filters.Transfer(null, checksummedWallet);
    
    console.log(`📡 Listening for USDT transfers to: ${checksummedWallet}`);
    
    usdtContract.on(transferFilter, async (from, to, value, event) => {
      try {
        const amount = ethers.formatUnits(value, 6); // USDT has 6 decimals
        console.log(`💰 LIVE PAYMENT DETECTED! ${amount} USDT from ${from}`);
        console.log(`🔗 Transaction: ${event.transactionHash}`);
        
        const payment = {
          txHash: event.transactionHash,
          from,
          to,
          amount,
          token: 'USDT',
          network: 'ethereum',
          blockNumber: event.blockNumber,
          timestamp: new Date()
        };
        
        // Call the callback function
        onPaymentReceived(payment);
        
      } catch (error) {
        console.error("Error processing live payment:", error);
      }
    });
    
    // Also listen for ETH transfers (direct to wallet)
    provider.on("block", async (blockNumber) => {
      if (blockNumber % 10 === 0) { // Log every 10th block
        console.log(`📊 Latest block: ${blockNumber}`);
      }
    });
    
    // Handle connection errors
    provider.on("error", (error) => {
      console.error("Provider error:", error);
    });
    
    if (provider instanceof ethers.WebSocketProvider) {
      provider.websocket.on("close", () => {
        console.warn("WebSocket connection closed, attempting to reconnect...");
        // Auto-reconnect logic could be added here
      });
    }
    
    return { success: true, provider: provider instanceof ethers.WebSocketProvider ? "websocket" : "http" };
    
  } catch (error) {
    console.error("Failed to start wallet listener:", error);
    return { success: false, error: String(error) };
  }
}