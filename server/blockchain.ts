import { ethers } from "ethers";
import { db } from "./db";
import { platformSettings } from "../shared/schema";
import { eq } from "drizzle-orm";

// Cache for dynamic settings to avoid frequent database queries
let networkConfigCache: any = null;
let cacheLastUpdated = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Dynamic network configuration loader
export async function getNetworkConfig() {
  const now = Date.now();
  
  // Return cached config if still valid
  if (networkConfigCache && (now - cacheLastUpdated) < CACHE_DURATION) {
    return networkConfigCache;
  }
  
  try {
    // Fetch blockchain settings from database
    const settings = await db.select({
      key: platformSettings.key,
      value: platformSettings.value
    })
    .from(platformSettings)
    .where(eq(platformSettings.category, 'blockchain'));
    
    const settingsMap = settings.reduce((acc, setting) => {
      if (setting.value) {
        acc[setting.key] = setting.value;
      }
      return acc;
    }, {} as Record<string, string>);
    
    // Build network config with database settings and fallbacks
    networkConfigCache = {
      ethereum: {
        name: "Ethereum Mainnet",
        chainId: 1,
        rpcUrl: settingsMap['ethereum_rpc_url'] || process.env.ETH_RPC_URL || "https://eth.llamarpc.com",
        rpcBackup: settingsMap['ethereum_rpc_backup'] || "https://rpc.ankr.com/eth",
        wsUrl: process.env.ETH_WS_URL || "wss://ethereum-rpc.publicnode.com",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        timeout: parseInt(settingsMap['rpc_timeout_ms'] || '10000'),
        monitoringEnabled: settingsMap['blockchain_monitoring_enabled'] === 'true'
      },
      bsc: {
        name: "BSC Mainnet",
        chainId: 56,
        rpcUrl: settingsMap['bsc_rpc_url'] || "https://bsc.llamarpc.com",
        rpcBackup: settingsMap['bsc_rpc_backup'] || "https://rpc.ankr.com/bsc",
        nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
        timeout: parseInt(settingsMap['rpc_timeout_ms'] || '10000'),
        monitoringEnabled: settingsMap['blockchain_monitoring_enabled'] === 'true'
      }
    };
    
    cacheLastUpdated = now;
    console.log('🔧 Network configuration loaded from database:', {
      ethereum_rpc: networkConfigCache.ethereum.rpcUrl,
      bsc_rpc: networkConfigCache.bsc.rpcUrl,
      monitoring: networkConfigCache.ethereum.monitoringEnabled
    });
    
    return networkConfigCache;
    
  } catch (error) {
    console.error('⚠️  Failed to load network config from database, using fallbacks:', error);
    
    // Return hardcoded fallbacks if database fails
    networkConfigCache = {
      ethereum: {
        name: "Ethereum Mainnet",
        chainId: 1,
        rpcUrl: process.env.ETH_RPC_URL || "https://eth.llamarpc.com",
        wsUrl: process.env.ETH_WS_URL || "wss://ethereum-rpc.publicnode.com",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        timeout: 10000,
        monitoringEnabled: true
      }
    };
    
    return networkConfigCache;
  }
}

// Legacy static export for backwards compatibility (will be dynamically updated)
export let networks = {
  ethereum: {
    name: "Ethereum Mainnet",
    chainId: 1,
    rpcUrl: "https://eth.llamarpc.com", // Will be updated by getNetworkConfig
    wsUrl: "wss://ethereum-rpc.publicnode.com",
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
  ethereum: "0x21e1f57a753fE27F7d8068002F65e8a830E2e6A8"  // Updated platform wallet
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
    const networkConfig = await getNetworkConfig();
    
    if (!networkConfig[network]) {
      return { success: false, error: "Unsupported network" };
    }

    const provider = new ethers.JsonRpcProvider(networkConfig[network].rpcUrl);
    
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
    const networkConfig = await getNetworkConfig();
    const provider = new ethers.JsonRpcProvider(networkConfig[network].rpcUrl);
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
    const networkConfig = await getNetworkConfig();
    const provider = new ethers.JsonRpcProvider(networkConfig.ethereum.rpcUrl);
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Ethereum RPC connected (${networkConfig.ethereum.rpcUrl}). Latest block: ${blockNumber}`);
    return { success: true, blockNumber, rpcUrl: networkConfig.ethereum.rpcUrl };
  } catch (error) {
    console.error("❌ RPC connection failed:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Real-time wallet listener using WebSocket
 */
// Active campaign listeners tracker
const activeCampaignListeners = new Map<number, any>();

export async function startWalletListener(platformWallet: string, onPaymentReceived: (payment: any) => void) {
  try {
    const checksummedWallet = ethers.getAddress(platformWallet);
    console.log(`🔍 Starting real-time wallet listener for: ${checksummedWallet}`);
    
    const networkConfig = await getNetworkConfig();
    
    // Try WebSocket first for real-time monitoring
    let provider;
    try {
      provider = new ethers.WebSocketProvider(networkConfig.ethereum.wsUrl);
      console.log(`🌐 Connected via WebSocket: ${networkConfig.ethereum.wsUrl}`);
    } catch (wsError) {
      console.warn("WebSocket failed, falling back to HTTP RPC");
      provider = new ethers.JsonRpcProvider(networkConfig.ethereum.rpcUrl);
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
    
    if (provider instanceof ethers.WebSocketProvider && (provider as any).websocket) {
      (provider as any).websocket.on("close", () => {
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

/**
 * Start listening to a specific campaign's wallet for donations
 */
export async function startCampaignListener(
  campaignId: number, 
  ownerWallet: string, 
  onDonationReceived: (donation: any) => void
) {
  try {
    const checksummedWallet = ethers.getAddress(ownerWallet);
    console.log(`🔍 Starting campaign listener for Campaign #${campaignId}: ${checksummedWallet}`);
    
    // Skip if already listening to this campaign
    if (activeCampaignListeners.has(campaignId)) {
      console.log(`⚠️  Already listening to Campaign #${campaignId}`);
      return { success: true, status: "already_active" };
    }
    
    const networkConfig = await getNetworkConfig();
    
    // Try WebSocket first for real-time monitoring
    let provider;
    try {
      provider = new ethers.WebSocketProvider(networkConfig.ethereum.wsUrl);
      console.log(`🌐 Connected via WebSocket for Campaign #${campaignId}`);
    } catch (wsError) {
      console.warn(`WebSocket failed for Campaign #${campaignId}, falling back to HTTP RPC`);
      provider = new ethers.JsonRpcProvider(networkConfig.ethereum.rpcUrl);
    }
    
    const usdtContract = new ethers.Contract(TOKENS.ethereum.USDT, ERC20_ABI, provider);
    
    // Listen for USDT transfers TO this campaign wallet
    const transferFilter = usdtContract.filters.Transfer(null, checksummedWallet);
    
    console.log(`📡 Listening for USDT donations to Campaign #${campaignId}: ${checksummedWallet}`);
    
    const listenerCallback = async (from: string, to: string, value: any, event: any) => {
      try {
        const amount = ethers.formatUnits(value, 6); // USDT has 6 decimals
        console.log(`💰 DONATION DETECTED! Campaign #${campaignId}: ${amount} USDT from ${from}`);
        console.log(`🔗 Transaction: ${event.transactionHash}`);
        
        const donation = {
          campaignId,
          txHash: event.transactionHash,
          donorWallet: from,
          ownerWallet: to,
          amount,
          token: 'USDT',
          network: 'ethereum',
          blockNumber: event.blockNumber,
          timestamp: new Date()
        };
        
        // Call the callback function to process donation
        await onDonationReceived(donation);
        
      } catch (error) {
        console.error(`Error processing donation for Campaign #${campaignId}:`, error);
      }
    };
    
    // Start listening
    usdtContract.on(transferFilter, listenerCallback);
    
    // Store the listener info for cleanup later
    activeCampaignListeners.set(campaignId, {
      provider,
      contract: usdtContract,
      filter: transferFilter,
      callback: listenerCallback,
      wallet: checksummedWallet
    });
    
    return { 
      success: true, 
      status: "active",
      provider: provider instanceof ethers.WebSocketProvider ? "websocket" : "http" 
    };
    
  } catch (error) {
    console.error(`Failed to start campaign listener for #${campaignId}:`, error);
    return { success: false, error: String(error) };
  }
}

/**
 * Stop listening to a specific campaign's wallet
 */
export async function stopCampaignListener(campaignId: number) {
  try {
    const listenerInfo = activeCampaignListeners.get(campaignId);
    if (!listenerInfo) {
      console.log(`⚠️  No active listener for Campaign #${campaignId}`);
      return { success: true, status: "not_active" };
    }
    
    // Remove the event listener
    listenerInfo.contract.off(listenerInfo.filter, listenerInfo.callback);
    
    // Remove from active listeners
    activeCampaignListeners.delete(campaignId);
    
    console.log(`🛑 Stopped listening to Campaign #${campaignId}: ${listenerInfo.wallet}`);
    
    return { success: true, status: "stopped" };
    
  } catch (error) {
    console.error(`Failed to stop campaign listener for #${campaignId}:`, error);
    return { success: false, error: String(error) };
  }
}

/**
 * Start listeners for all active campaigns
 */
export async function startAllCampaignListeners(
  campaigns: Array<{id: number, ownerWallet: string, status: string}>,
  onDonationReceived: (donation: any) => void
) {
  console.log(`🚀 Starting listeners for ${campaigns.length} active campaigns`);
  
  const results = [];
  
  for (const campaign of campaigns) {
    if (campaign.status === 'active') {
      const result = await startCampaignListener(
        campaign.id, 
        campaign.ownerWallet, 
        onDonationReceived
      );
      results.push({ campaignId: campaign.id, ...result });
    }
  }
  
  console.log(`✅ Campaign listeners started: ${results.filter(r => r.success).length}/${results.length}`);
  
  return {
    success: true,
    started: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
}

/**
 * Get status of all active campaign listeners
 */
export function getCampaignListenersStatus() {
  const activeListeners = Array.from(activeCampaignListeners.entries()).map(([campaignId, info]) => ({
    campaignId,
    wallet: info.wallet,
    active: true
  }));
  
  return {
    totalActive: activeListeners.length,
    listeners: activeListeners
  };
}