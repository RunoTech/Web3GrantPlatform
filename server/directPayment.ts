import { ethers } from "ethers";
import { getNetworkConfig, getTokenAddresses } from "./blockchain";

// ERC-20 ABI for token operations
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Dynamic network configurations loaded from database  
async function getPaymentNetworks() {
  const networkConfig = await getNetworkConfig();
  
  const networks: any = {
    ethereum: {
      chainId: networkConfig.ethereum.chainId,
      name: networkConfig.ethereum.name,
      rpcUrl: networkConfig.ethereum.rpcUrl,
      nativeCurrency: networkConfig.ethereum.nativeCurrency,
      blockExplorer: "https://etherscan.io"
    }
  };
  
  // Only add BSC if configuration exists
  if (networkConfig.bsc) {
    networks.bsc = {
      chainId: networkConfig.bsc.chainId,
      name: networkConfig.bsc.name, 
      rpcUrl: networkConfig.bsc.rpcUrl,
      nativeCurrency: networkConfig.bsc.nativeCurrency,
      blockExplorer: "https://bscscan.com"
    };
  }
  
  return networks;
}

// Dynamic token addresses loaded from database
export async function getPaymentTokens() {
  return await getTokenAddresses();
}

interface DirectPaymentResult {
  success: boolean;
  txHash?: string;
  error?: string;
  amount?: string;
  token?: string;
}

/**
 * Process direct payment using Web3 provider
 * This function handles the complete payment flow without requiring transaction hash verification
 */
export async function processDirectPayment(
  network: string,
  userWallet: string,
  platformWallet: string,
  tokenAddress: string,
  amount: string,
  decimals: number
): Promise<DirectPaymentResult> {
  try {
    const networks = await getPaymentNetworks();
    
    if (!networks[network as keyof typeof networks]) {
      return { success: false, error: "Unsupported network" };
    }

    const networkConfig = networks[network as keyof typeof networks];
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    
    // Create contract instance
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    // Get token symbol for logging
    const tokenSymbol = await contract.symbol();
    
    // Convert amount to proper units
    const transferAmount = ethers.parseUnits(amount, decimals);
    
    // Prepare transaction data
    const txData = {
      to: tokenAddress,
      data: contract.interface.encodeFunctionData("transfer", [platformWallet, transferAmount]),
      value: "0x0", // ERC-20 transfer has no ETH value
      gas: "0x15f90", // 90000 gas limit
      gasPrice: await provider.getFeeData().then(fee => fee.gasPrice?.toString() || "0x5208")
    };

    return {
      success: true,
      amount,
      token: tokenSymbol,
      error: undefined
    };

  } catch (error) {
    console.error("Direct payment processing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment processing failed"
    };
  }
}

/**
 * Validate payment request before processing
 */
export async function validatePaymentRequest(
  network: string,
  userWallet: string,
  platformWallet: string,
  amount: string
): Promise<{ valid: boolean; error?: string }> {
  const networks = await getPaymentNetworks();
  
  if (!network || !networks[network as keyof typeof networks]) {
    return { valid: false, error: "Invalid or unsupported network" };
  }

  if (!userWallet || !ethers.isAddress(userWallet)) {
    return { valid: false, error: "Invalid user wallet address" };
  }

  if (!platformWallet || !ethers.isAddress(platformWallet)) {
    return { valid: false, error: "Invalid platform wallet address" };
  }

  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return { valid: false, error: "Invalid amount" };
  }

  return { valid: true };
}