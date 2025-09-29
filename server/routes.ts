import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import multer from 'multer';
import { storage } from "./storage";
import { 
  insertNetworkFeeSchema,
  insertAccountSchema,
  insertCampaignSchema,
  insertDonationSchema,
  insertDailyEntrySchema,
  insertDailyWinnerSchema,
  insertFooterLinkSchema,
  insertAnnouncementSchema,
  insertPlatformSettingSchema,
  insertAdminSchema,
  insertPaymentAttemptSchema,
  insertUserNonceSchema,
  insertUserSessionSchema,
  insertPendingPaymentSchema,
  type Admin,
  type UserNonce,
  type UserSession,
} from "../shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { ethers } from "ethers";
// Modern wallet integration - server-side blockchain operations

// Security: HTML/XSS Sanitization utility
function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .trim();
}

// Campaign ownership validation helper
async function validateCampaignOwnership(campaignId: number, userWallet: string): Promise<boolean> {
  try {
    const campaign = await storage.getCampaign(campaignId);
    if (!campaign) return false;
    return campaign.ownerWallet.toLowerCase() === userWallet.toLowerCase();
  } catch (error) {
    console.error('Campaign ownership validation error:', error);
    return false;
  }
}

// Security: JWT Secret - MUST be set in production
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error("🚨 CRITICAL: JWT_SECRET environment variable is not set!");
    console.error("🔑 Please set JWT_SECRET for secure authentication");
    process.exit(1);
  } else {
    console.warn("⚠️  WARNING: JWT_SECRET not set, using development secret");
    console.warn("🔑 MUST set JWT_SECRET in production!");
  }
}

// Use secure secret for production, development fallback for demo
const JWT_SECRET_VALIDATED = JWT_SECRET || "duxxan-development-secret-key-2024-very-long-and-secure-for-demo-only";

// Admin authentication middleware
interface AuthenticatedRequest extends Request {
  admin: Admin;
}

async function authenticateAdmin(req: AuthenticatedRequest, res: any, next: any) {
  try {
    // SECURITY FIX: Read JWT from httpOnly cookie instead of Authorization header
    const token = req.cookies.admin_auth_token;
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET_VALIDATED) as any;
    const admin = await storage.getAdmin(decoded.adminId);
    
    if (!admin || !admin.active) {
      return res.status(401).json({ error: "Invalid or inactive admin" });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid authentication token" });
  }
}

// User authentication middleware
interface UserAuthenticatedRequest extends Request {
  userWallet: string;
  sessionId: string;
}

async function authenticateUser(req: UserAuthenticatedRequest, res: any, next: any) {
  try {
    // SECURITY FIX: Read JWT from httpOnly cookie instead of Authorization header
    const token = req.cookies.user_auth_token;
    if (!token) {
      return res.status(401).json({ error: "Authentication required. Please connect your wallet and sign the message." });
    }

    const decoded = jwt.verify(token, JWT_SECRET_VALIDATED) as any;
    if (!decoded.sessionId || !decoded.wallet) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    // Verify session is still valid
    const session = await storage.getUserSession(decoded.sessionId);
    if (!session || !session.active || session.expiresAt <= new Date()) {
      return res.status(401).json({ error: "Session expired. Please reconnect your wallet." });
    }

    // Update last used
    await storage.updateSessionLastUsed(decoded.sessionId);

    req.userWallet = session.wallet;
    req.sessionId = session.sessionId;
    next();
  } catch (error) {
    console.error("User auth error:", error);
    res.status(401).json({ error: "Invalid authentication token" });
  }
}

// Rate limiting configurations
const authRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: { error: "Too many authentication attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const accountRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute 
  max: 5, // 5 requests per minute per IP
  message: { error: "Too many account creation attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminAuthRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute per IP
  message: { error: "Too many admin login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalApiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation helper
const validatePaginationParams = (req: any, res: any, next: any) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  
  // Cap limits to prevent DoS
  if (limit > 100) {
    return res.status(400).json({ error: "Limit cannot exceed 100" });
  }
  if (offset < 0) {
    return res.status(400).json({ error: "Offset cannot be negative" });
  }
  
  req.query.limit = Math.min(limit, 100);
  req.query.offset = Math.max(offset, 0);
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Security: Apply Helmet middleware for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://checkout.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.stripe.com", "https://ethereum-rpc.publicnode.com", "wss://ethereum-rpc.publicnode.com"],
        frameSrc: ["https://js.stripe.com", "https://checkout.stripe.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  }));
  
  // Apply general rate limiting to all routes
  app.use("/api", generalApiRateLimit);
  
  // Public API Routes (existing functionality)
  
  // Get network fees (public) - Ethereum only
  app.get("/api/get-fees", async (req, res) => {
    try {
      const fees = [
        {
          network: "ethereum",
          tokenSymbol: "USDT",
          tokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          decimals: 6,
          amount: "50",
          active: true
        }
      ];
      res.json(fees);
    } catch (error) {
      console.error("Error fetching fees:", error);
      res.status(500).json({ error: "Failed to fetch fees" });
    }
  });

  // Get fees endpoint for frontend (Ethereum only)
  app.get("/api/fees", async (req, res) => {
    try {
      const fees = {
        ethereum: {
          amount: 50,
          symbol: "USDT",
          contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          decimals: 6
        }
      };
      
      res.json(fees);
    } catch (error) {
      console.error("Error fetching fees:", error);
      res.status(500).json({ message: "Failed to fetch fees" });
    }
  });

  // Helper function to filter out company private information
  const filterCampaignForPublic = (campaign: any) => {
    const {
      companyName,
      companyRegistrationNumber, 
      companyAddress,
      companyWebsite,
      companyEmail,
      companyPhone,
      companyCEO,
      companyFoundedYear,
      companyIndustry,
      companyEmployeeCount,
      ...publicCampaign
    } = campaign;
    return publicCampaign;
  };

  // Get popular campaigns (public)
  app.get("/api/get-popular-campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getPopularCampaigns(6);
      // Filter out company private information for public API
      const publicCampaigns = campaigns.map(filterCampaignForPublic);
      res.json(publicCampaigns);
    } catch (error) {
      console.error("Error fetching popular campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // Get all campaigns with filtering (public)
  app.get("/api/get-campaigns", validatePaginationParams, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Extract filter parameters
      const filters: any = {};
      
      if (req.query.search) filters.search = req.query.search as string;
      if (req.query.campaignType) filters.campaignType = req.query.campaignType as string;
      if (req.query.creatorType) filters.creatorType = req.query.creatorType as string;
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.minAmount) filters.minAmount = parseFloat(req.query.minAmount as string);
      if (req.query.maxAmount) filters.maxAmount = parseFloat(req.query.maxAmount as string);
      if (req.query.sortBy) filters.sortBy = req.query.sortBy as string;
      if (req.query.creditCardEnabled) filters.creditCardEnabled = req.query.creditCardEnabled === 'true';
      
      const campaigns = await storage.getCampaigns(limit, offset, filters);
      // Filter out company private information for public API
      const publicCampaigns = campaigns.map(filterCampaignForPublic);
      res.json(publicCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // Get single campaign by ID (public)
  app.get("/api/campaign/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      // Filter out company private information for public API
      const publicCampaign = filterCampaignForPublic(campaign);
      res.json(publicCampaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });

  // Get daily winners (public)
  app.get("/api/get-last-winners", async (req, res) => {
    try {
      const winners = await storage.getDailyWinners(10);
      res.json(winners);
    } catch (error) {
      console.error("Error fetching winners:", error);
      res.status(500).json({ error: "Failed to fetch winners" });
    }
  });

  // Get today's stats for daily rewards (public)
  app.get("/api/today-stats", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const entries = await storage.getDailyEntries(today);
      res.json({
        participants: entries.length,
        date: today
      });
    } catch (error) {
      console.error("Error fetching today stats:", error);
      res.status(500).json({ error: "Failed to fetch today stats" });
    }
  });

  // Check if user can participate in daily reward (public)
  const canParticipateSchema = z.object({
    wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address format")
  });
  
  app.get("/api/can-participate-daily/:wallet", async (req, res) => {
    try {
      const validation = canParticipateSchema.safeParse({ wallet: req.params.wallet });
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid wallet address format" });
      }
      
      const { wallet } = validation.data;
      const today = new Date().toISOString().split('T')[0];
      const canParticipate = await storage.canParticipateDaily(wallet, today);
      
      res.json({ canParticipate, date: today });
    } catch (error) {
      console.error("Error checking daily participation:", error);
      res.status(500).json({ error: "Failed to check participation status" });
    }
  });

  // Auto participate in daily reward (public)
  const autoDailyEntrySchema = z.object({
    wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address format"),
    signature: z.string().optional(),
    timestamp: z.number().optional()
  });
  
  app.post("/api/auto-daily-entry", async (req, res) => {
    try {
      const validation = autoDailyEntrySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request data", details: validation.error.errors });
      }
      
      const { wallet } = validation.data;
      
      // NO AUTH: Allow anyone to participate for any wallet

      const today = new Date().toISOString().split('T')[0];
      const canParticipate = await storage.canParticipateDaily(wallet, today);
      
      if (!canParticipate) {
        return res.status(400).json({ error: "Already participated today" });
      }

      // Check if account exists and is active
      const account = await storage.getAccount(wallet);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      if (!account.active) {
        return res.status(400).json({ error: "Account must be activated to participate" });
      }

      // Create daily entry
      const entry = await storage.createDailyEntry({
        wallet,
        date: today
      });

      // Update account daily entry tracking
      await storage.updateAccount(wallet, {
        lastDailyEntryDate: today,
        totalDailyEntries: account.totalDailyEntries ? account.totalDailyEntries + 1 : 1
      });

      res.json({ success: true, entry, message: "Successfully participated in today's reward draw" });
    } catch (error: any) {
      console.error("Error in auto daily entry:", error);
      
      // Handle race condition - already participated
      if (error.message === 'ALREADY_PARTICIPATED') {
        return res.status(400).json({ 
          error: "Already participated today",
          success: false
        });
      }
      
      res.status(500).json({ error: "Failed to participate in daily reward" });
    }
  });

  // Create account (public - NO AUTH REQUIRED)
  app.post("/api/create-account", accountRateLimit, async (req, res) => {
    try {
      // NO AUTH: Use wallet from request body
      const accountData = {
        wallet: req.body.wallet, // Use wallet from request body
        active: req.body.active || false, // Allow other fields from body
        referredBy: req.body.referredBy || null
      };
      
      const existingAccount = await storage.getAccount(accountData.wallet);
      
      if (existingAccount) {
        // Record login for existing user
        await storage.recordUserLogin(accountData.wallet);
        return res.status(200).json({ message: "Account exists, login recorded", account: existingAccount });
      }

      const account = await storage.createAccount(accountData);
      // Record initial login
      await storage.recordUserLogin(accountData.wallet);
      res.json(account);
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  // Activate account with payment verification (public - NO AUTH REQUIRED)
  app.post("/api/activate-account", accountRateLimit, async (req, res) => {
    try {
      const { txHash, wallet } = req.body;
      
      // NO AUTH: Use wallet from request body
      const walletAddress = wallet;
      
      if (!txHash) {
        return res.status(400).json({ error: "Transaction hash is required" });
      }

      // Security: Validate transaction hash format
      if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
        return res.status(400).json({ error: "Invalid transaction hash format" });
      }

      // Security: Check transaction idempotency - prevent replay attacks
      const transactionAlreadyUsed = await storage.isTransactionUsed(txHash);
      if (transactionAlreadyUsed) {
        return res.status(409).json({ 
          error: "Transaction hash already processed", 
          code: "TRANSACTION_ALREADY_USED"
        });
      }

      // Check if account exists
      const account = await storage.getAccount(walletAddress);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      if (account.active) {
        return res.status(400).json({ error: "Account is already active" });
      }

      // Security: Hardcode Ethereum mainnet and server-side configuration
      const NETWORK = 'ethereum';
      
      // Get Ethereum network fee (server-side configuration)
      const networkFees = await storage.getActiveNetworkFees();
      const networkFee = networkFees.find(fee => fee.network === NETWORK);
      
      if (!networkFee) {
        return res.status(500).json({ error: "Ethereum network fee not configured" });
      }

      // Get Ethereum platform wallet address (server-side configuration)
      const settings = await storage.getPlatformSettings("payment");
      const platformWalletSetting = settings.find(s => s.key === "ethereum_wallet_address");
      
      if (!platformWalletSetting?.value) {
        return res.status(500).json({ error: "Ethereum platform wallet not configured" });
      }

      // Verify payment using enhanced blockchain verification with confirmations
      const { verifyPayment } = await import("./blockchain");
      const verification = await verifyPayment(
        NETWORK,
        txHash,
        networkFee.amount || "0",
        networkFee.tokenAddress || "",
        platformWalletSetting.value
      );

      if (!verification.success) {
        return res.status(400).json({ error: verification.error || "Payment verification failed" });
      }

      // Security: Store used transaction to prevent reuse
      await storage.createUsedTransaction({
        txHash,
        network: NETWORK,
        purpose: 'account_activation',
        wallet: walletAddress,
        amount: verification.amount || "0",
        tokenAddress: networkFee.tokenAddress,
        blockNumber: verification.blockNumber
      });

      // Activate account
      await storage.updateAccount(walletAddress, {
        active: true,
        activationTxHash: txHash,
        activationDate: new Date(),
      });

      res.json({ 
        success: true,
        verified: true,
        amount: verification.amount,
        confirmations: verification.confirmations,
        blockNumber: verification.blockNumber,
        message: "Account activated successfully"
      });
    } catch (error) {
      console.error("Error activating account:", error);
      res.status(500).json({ error: "Failed to activate account" });
    }
  });

  // Get account (public)
  app.get("/api/account/:wallet", async (req, res) => {
    try {
      const { wallet } = req.params;
      const account = await storage.getAccount(wallet);
      
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      res.json(account);
    } catch (error) {
      console.error("Error fetching account:", error);
      res.status(500).json({ error: "Failed to fetch account" });
    }
  });










  
  // ===== USER ANALYTICS DASHBOARD ROUTES =====
  
  // Get comprehensive user dashboard data
  app.get("/api/analytics/dashboard/:wallet", authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      const { wallet } = req.params;
      if (!ethers.isAddress(wallet)) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
      
      // Security: Ensure user can only access their own analytics
      if (wallet.toLowerCase() !== req.userWallet.toLowerCase()) {
        return res.status(403).json({ error: "Access denied: Can only view your own analytics" });
      }
      
      // Get all analytics data for dashboard
      const [donationStats, campaignAnalytics, timeAnalytics, recentDonations] = await Promise.all([
        storage.getUserDonationStats(wallet),
        storage.getUserCampaignAnalytics(wallet),
        storage.getUserTimeAnalytics(wallet, '30d'),
        storage.getUserDonationHistory(wallet, { limit: 10 })
      ]);
      
      res.json({
        donationStats,
        campaignAnalytics,
        timeAnalytics,
        recentDonations
      });
    } catch (error) {
      console.error("Get user dashboard data error:", error);
      res.status(500).json({ error: "Failed to get dashboard data" });
    }
  });
  
  // Get user donation history with filtering
  app.get("/api/analytics/donations/:wallet", authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      const { wallet } = req.params;
      if (!ethers.isAddress(wallet)) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
      
      // Security: Ensure user can only access their own analytics
      if (wallet.toLowerCase() !== req.userWallet.toLowerCase()) {
        return res.status(403).json({ error: "Access denied: Can only view your own analytics" });
      }
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
        campaignType: req.query.campaignType as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100
      };
      
      const donationHistory = await storage.getUserDonationHistory(wallet, filters);
      res.json(donationHistory);
    } catch (error) {
      console.error("Get user donation history error:", error);
      res.status(500).json({ error: "Failed to get donation history" });
    }
  });
  
  // Get analytics for all user's campaigns
  app.get("/api/analytics/user-campaigns/:wallet", authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      const { wallet } = req.params;
      if (!ethers.isAddress(wallet)) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
      
      // Security: Ensure user can only access their own analytics
      if (wallet.toLowerCase() !== req.userWallet.toLowerCase()) {
        return res.status(403).json({ error: "Access denied: Can only view your own analytics" });
      }
      
      const userCampaignAnalytics = await storage.getUserCampaignAnalytics(wallet);
      res.json(userCampaignAnalytics);
    } catch (error) {
      console.error("Get user campaign analytics error:", error);
      res.status(500).json({ error: "Failed to get user campaign analytics" });
    }
  });
  
  // Get analytics for a specific campaign
  app.get("/api/analytics/campaign/:id", authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      const campaignId = parseInt(req.params.id, 10);
      if (isNaN(campaignId)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }
      
      // Security: Verify campaign ownership
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      if (campaign.ownerWallet.toLowerCase() !== req.userWallet.toLowerCase()) {
        return res.status(403).json({ error: "Access denied: Can only view analytics for your own campaigns" });
      }
      
      const campaignAnalytics = await storage.getCampaignAnalytics(campaignId);
      res.json(campaignAnalytics);
    } catch (error) {
      console.error("Get campaign analytics error:", error);
      if (error.message === 'Campaign not found') {
        res.status(404).json({ error: "Campaign not found" });
      } else {
        res.status(500).json({ error: "Failed to get campaign analytics" });
      }
    }
  });
  
  // Get time-based analytics for user
  app.get("/api/analytics/time-analytics/:wallet", authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      const { wallet } = req.params;
      if (!ethers.isAddress(wallet)) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
      
      // Security: Ensure user can only access their own analytics
      if (wallet.toLowerCase() !== req.userWallet.toLowerCase()) {
        return res.status(403).json({ error: "Access denied: Can only view your own analytics" });
      }
      
      const timeRange = (req.query.range as string) || '30d';
      const validRanges = ['7d', '30d', '90d', '1y'];
      if (!validRanges.includes(timeRange)) {
        return res.status(400).json({ error: "Invalid time range. Use: 7d, 30d, 90d, 1y" });
      }
      
      const timeAnalytics = await storage.getUserTimeAnalytics(wallet, timeRange);
      res.json(timeAnalytics);
    } catch (error) {
      console.error("Get user time analytics error:", error);
      res.status(500).json({ error: "Failed to get time-based analytics" });
    }
  });

  // SECURED: Direct payment activation (protected - requires authentication)
  // Previously CRITICAL VULNERABILITY - now uses proper blockchain verification
  app.post("/api/direct-activate", accountRateLimit, authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      const { txHash } = req.body;
      
      // Security: Use authenticated wallet instead of trusting client data
      const wallet = req.userWallet;
      
      if (!txHash) {
        return res.status(400).json({ error: "Transaction hash is required" });
      }

      // Security: Validate transaction hash format
      if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
        return res.status(400).json({ error: "Invalid transaction hash format" });
      }

      // Security: Check transaction idempotency - prevent replay attacks
      const transactionAlreadyUsed = await storage.isTransactionUsed(txHash);
      if (transactionAlreadyUsed) {
        return res.status(409).json({ 
          error: "Transaction hash already processed", 
          code: "TRANSACTION_ALREADY_USED"
        });
      }

      // Check if account exists, create if not
      let account = await storage.getAccount(wallet);
      if (!account) {
        account = await storage.createAccount({
          wallet,
          active: false,
        });
      }

      if (account.active) {
        return res.status(400).json({ error: "Account is already active" });
      }

      // Security: Hardcode Ethereum mainnet and server-side configuration
      const NETWORK = 'ethereum';
      
      // Get Ethereum network fee (server-side configuration)
      const networkFees = await storage.getActiveNetworkFees();
      const networkFee = networkFees.find(fee => fee.network === NETWORK);
      
      if (!networkFee) {
        return res.status(500).json({ error: "Ethereum network fee not configured" });
      }

      // Get Ethereum platform wallet address (server-side configuration)
      const settings = await storage.getPlatformSettings("payment");
      const platformWalletSetting = settings.find(s => s.key === "ethereum_wallet_address");
      
      if (!platformWalletSetting?.value) {
        return res.status(500).json({ error: "Ethereum platform wallet not configured" });
      }

      // SECURITY: Now verify payment using enhanced blockchain verification with confirmations
      // Previously this endpoint trusted client without ANY verification - CRITICAL VULNERABILITY FIXED
      const { verifyPayment } = await import("./blockchain");
      const verification = await verifyPayment(
        NETWORK,
        txHash,
        networkFee.amount || "0",
        networkFee.tokenAddress || "",
        platformWalletSetting.value
      );

      if (!verification.success) {
        return res.status(400).json({ error: verification.error || "Payment verification failed" });
      }

      // Security: Store used transaction to prevent reuse
      await storage.createUsedTransaction({
        txHash,
        network: NETWORK,
        purpose: 'account_activation',
        wallet,
        amount: verification.amount || "0",
        tokenAddress: networkFee.tokenAddress,
        blockNumber: verification.blockNumber
      });

      // Activate account (now with proper verification)
      await storage.updateAccount(wallet, {
        active: true,
        activationTxHash: txHash,
        activationDate: new Date(),
      });

      res.json({ 
        success: true,
        verified: true,
        amount: verification.amount,
        confirmations: verification.confirmations,
        blockNumber: verification.blockNumber,
        tokenSymbol: networkFee.tokenSymbol,
        txHash: txHash,
        message: "Account activated successfully"
      });
    } catch (error) {
      console.error("Error with direct activation:", error);
      res.status(500).json({ error: "Failed to activate account" });
    }
  });

  // Create campaign (public - NO AUTH REQUIRED)
  app.post("/api/create-campaign", async (req, res) => {
    try {
      const campaignData = req.body;
      
      // Security: Input Sanitization - Sanitize HTML/XSS from user inputs
      if (campaignData.title) {
        campaignData.title = sanitizeHtml(campaignData.title);
      }
      if (campaignData.description) {
        campaignData.description = sanitizeHtml(campaignData.description);
      }
      if (campaignData.companyName) {
        campaignData.companyName = sanitizeHtml(campaignData.companyName);
      }
      if (campaignData.companyCEO) {
        campaignData.companyCEO = sanitizeHtml(campaignData.companyCEO);
      }
      
      // NO AUTH: Allow anyone to create campaigns for any wallet
      
      // Validate FUND/DONATE rules
      if (campaignData.campaignType === "FUND" && campaignData.creatorType !== "company") {
        return res.status(400).json({ error: "FUND campaigns can only be created by companies" });
      }
      
      if (campaignData.campaignType === "DONATE" && campaignData.creatorType === "company") {
        return res.status(400).json({ error: "DONATE campaigns cannot be created by companies" });
      }
      
      if (campaignData.campaignType === "DONATE" && (!campaignData.startDate || !campaignData.endDate)) {
        return res.status(400).json({ error: "DONATE campaigns must have start and end dates" });
      }
      
      // Validate credit card payment fields with dynamic fees
      if (campaignData.creditCardEnabled) {
        // Get dynamic collateral amount from platform settings
        const collateralSettings = await storage.getPlatformSettings('payments');
        const collateralAmountSetting = collateralSettings.find(s => s.key === 'credit_card_collateral_amount');
        const creditCardEnabledSetting = collateralSettings.find(s => s.key === 'credit_card_enabled');
        const requiredCollateral = parseFloat(collateralAmountSetting?.value || '2');
        const creditCardFeatureEnabled = creditCardEnabledSetting?.value === 'true';
        
        if (!creditCardFeatureEnabled) {
          return res.status(400).json({ error: "Credit card payment feature is currently disabled" });
        }
        
        if (!campaignData.collateralTxHash) {
          return res.status(400).json({ error: "Collateral transaction hash is required" });
        }

        // Security: Validate transaction hash format
        if (!/^0x[a-fA-F0-9]{64}$/.test(campaignData.collateralTxHash)) {
          return res.status(400).json({ error: "Invalid collateral transaction hash format" });
        }

        // Security: Check transaction idempotency - prevent replay attacks for collateral
        const transactionAlreadyUsed = await storage.isTransactionUsed(campaignData.collateralTxHash);
        if (transactionAlreadyUsed) {
          return res.status(409).json({ 
            error: "Collateral transaction hash already processed", 
            code: "TRANSACTION_ALREADY_USED"
          });
        }
        
        // Security: Hardcode Ethereum mainnet
        const NETWORK = 'ethereum';
        
        // Get platform wallet address for Ethereum (server-side configuration)
        const paymentSettings = await storage.getPlatformSettings("payment");
        const platformWalletSetting = paymentSettings.find(s => s.key === "ethereum_wallet_address");
        
        if (!platformWalletSetting?.value) {
          return res.status(500).json({ error: "Ethereum platform wallet not configured" });
        }

        // Security: Use server-side token configuration instead of hardcoded address
        const tokenSettings = await storage.getPlatformSettings("payment");
        const usdtContractSetting = tokenSettings.find(s => s.key === "ethereum_usdt_contract");
        const usdtContract = usdtContractSetting?.value || "0xdAC17F958D2ee523a2206206994597C13D831ec7";
        
        // Verify collateral payment using enhanced blockchain verification with confirmations
        try {
          const { verifyPayment } = await import("./blockchain");
          const verification = await verifyPayment(
            NETWORK,
            campaignData.collateralTxHash,
            requiredCollateral.toString(),
            usdtContract,
            platformWalletSetting.value
          );
          
          if (!verification.success) {
            return res.status(400).json({ 
              error: `Collateral payment verification failed: ${verification.error}. Required: ${requiredCollateral} USDT with minimum 3 confirmations.` 
            });
          }

          // Security: Store used transaction to prevent reuse
          await storage.createUsedTransaction({
            txHash: campaignData.collateralTxHash,
            network: NETWORK,
            purpose: 'campaign_collateral',
            wallet: campaignData.ownerWallet,
            amount: verification.amount || requiredCollateral.toString(),
            tokenAddress: usdtContract,
            blockNumber: verification.blockNumber
          });
          
          // Set collateral as paid after successful verification
          campaignData.collateralPaid = true;
          campaignData.collateralAmount = requiredCollateral.toString();
          
        } catch (error) {
          console.error('Collateral verification error:', error);
          return res.status(400).json({ 
            error: `Failed to verify collateral payment: ${error}. Please ensure you sent ${requiredCollateral} USDT to the platform wallet with sufficient confirmations.` 
          });
        }
      }
      
      // Check if owner account is active (for now skip this requirement)
      // const account = await storage.getAccount(campaignData.ownerWallet);
      // if (!account || !account.active) {
      //   return res.status(403).json({ error: "Account must be activated first" });
      // }

      const campaign = await storage.createCampaign(campaignData);
      
      
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  // Join daily reward (protected - requires authentication)
  app.post("/api/join-daily-reward", authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      // Security: Use authenticated wallet instead of trusting client data
      const wallet = req.userWallet;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if entry already exists for today
      const alreadyEntered = await storage.checkDailyEntry(wallet, today);
      if (alreadyEntered) {
        return res.status(409).json({ error: "Already entered today" });
      }

      const entryData = {
        wallet,
        date: today
      };

      const entry = await storage.createDailyEntry(entryData);
      res.json({ success: true, message: "Successfully joined daily reward!" });
    } catch (error: any) {
      console.error("Error creating daily entry:", error);
      
      // Handle race condition - already participated
      if (error.message === 'ALREADY_PARTICIPATED') {
        return res.status(409).json({ 
          error: "Already entered today",
          success: false
        });
      }
      
      res.status(500).json({ error: "Failed to join daily reward" });
    }
  });

  // Create daily entry (public - but requires active account for admin panel)
  app.post("/api/daily-entry", async (req, res) => {
    try {
      const entryData = insertDailyEntrySchema.parse(req.body);
      
      // Check if account exists and is active
      const account = await storage.getAccount(entryData.wallet);
      if (!account || !account.active) {
        return res.status(403).json({ error: "Account must be activated first" });
      }

      // Check if entry already exists for today
      const alreadyEntered = await storage.checkDailyEntry(entryData.wallet, entryData.date);
      if (alreadyEntered) {
        return res.status(409).json({ error: "Already entered today" });
      }

      const entry = await storage.createDailyEntry(entryData);
      res.json(entry);
    } catch (error) {
      console.error("Error creating daily entry:", error);
      res.status(500).json({ error: "Failed to create daily entry" });
    }
  });

  // Record donation (public)
  app.post("/api/record-donation", authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      const donationData = insertDonationSchema.parse(req.body);
      
      // Security: Verify wallet ownership - only authenticated user can record donations for their own wallet
      if (!donationData.donorWallet || donationData.donorWallet.toLowerCase() !== req.userWallet.toLowerCase()) {
        return res.status(403).json({ 
          error: "Donation can only be recorded for your authenticated wallet address",
          expected: req.userWallet,
          provided: donationData.donorWallet 
        });
      }
      
      const donation = await storage.createDonation(donationData);
      
      
      res.json(donation);
    } catch (error) {
      console.error("Error recording donation:", error);
      res.status(500).json({ error: "Failed to record donation" });
    }
  });

  // Record payment attempt (public) - for tracking failed credit card payments
  app.post("/api/record-payment-attempt", async (req: Request, res: any) => {
    try {
      const attemptData = insertPaymentAttemptSchema.parse(req.body);
      // Override client-sent metadata with server-derived values for security
      const secureAttempt = {
        ...attemptData,
        ipAddress: req.ip || req.connection.remoteAddress || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown'
      };
      const paymentAttempt = await storage.createPaymentAttempt(secureAttempt);
      res.json(paymentAttempt);
    } catch (error) {
      console.error("Error recording payment attempt:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid payment attempt data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to record payment attempt" });
    }
  });

  // Get payment attempts for a campaign (protected) - for campaign owners only
  app.get("/api/campaign/:id/payment-attempts", authenticateUser, async (req: UserAuthenticatedRequest, res: any) => {
    try {
      const campaignId = parseInt(req.params.id);
      if (isNaN(campaignId)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }
      
      // Security: Verify campaign ownership - only campaign owner can see payment attempts
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      if (campaign.ownerWallet.toLowerCase() !== req.userWallet.toLowerCase()) {
        return res.status(403).json({ 
          error: "Access denied. Payment attempts can only be viewed by campaign owner",
          expected: campaign.ownerWallet,
          provided: req.userWallet 
        });
      }
      
      const attempts = await storage.getPaymentAttemptsByCampaign(campaignId);
      // Filter sensitive data for privacy/security
      const sanitizedAttempts = attempts.map(attempt => ({
        id: attempt.id,
        campaignId: attempt.campaignId,
        amount: attempt.amount,
        currency: attempt.currency,
        cardBrand: attempt.cardBrand,
        cardLast4: attempt.cardLast4 ? `••••${attempt.cardLast4.slice(-2)}` : null, // Show only last 2 digits
        status: attempt.status,
        errorCode: attempt.errorCode,
        errorMessage: attempt.errorMessage,
        attemptedAt: attempt.attemptedAt,
        processingTime: attempt.processingTime,
        // Excluded: initiatorWallet, ipAddress, userAgent for privacy
      }));
      res.json(sanitizedAttempts);
    } catch (error) {
      console.error("Error fetching campaign payment attempts:", error);
      res.status(500).json({ error: "Failed to fetch payment attempts" });
    }
  });

  // Get payment attempts for a wallet (protected) - for wallet owners only
  app.get("/api/wallet/:wallet/payment-attempts", authenticateUser, async (req: UserAuthenticatedRequest, res: any) => {
    try {
      const wallet = req.params.wallet;
      if (!wallet || wallet.length !== 42 || !wallet.startsWith('0x')) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
      
      // Security: Verify wallet ownership - only wallet owner can see their payment attempts
      if (wallet.toLowerCase() !== req.userWallet.toLowerCase()) {
        return res.status(403).json({ 
          error: "Access denied. Payment attempts can only be viewed by wallet owner",
          expected: req.userWallet,
          provided: wallet 
        });
      }
      
      const attempts = await storage.getPaymentAttemptsByWallet(wallet);
      // Filter sensitive data for privacy/security
      const sanitizedAttempts = attempts.map(attempt => ({
        id: attempt.id,
        campaignId: attempt.campaignId,
        amount: attempt.amount,
        currency: attempt.currency,
        cardBrand: attempt.cardBrand,
        cardLast4: attempt.cardLast4 ? `••••${attempt.cardLast4.slice(-2)}` : null, // Show only last 2 digits
        status: attempt.status,
        errorCode: attempt.errorCode,
        errorMessage: attempt.errorMessage,
        attemptedAt: attempt.attemptedAt,
        processingTime: attempt.processingTime,
        // Excluded: initiatorWallet, ipAddress, userAgent for privacy
      }));
      res.json(sanitizedAttempts);
    } catch (error) {
      console.error("Error fetching wallet payment attempts:", error);
      res.status(500).json({ error: "Failed to fetch payment attempts" });
    }
  });

  // Get footer links (public)
  app.get("/api/footer-links", async (req, res) => {
    try {
      const section = req.query.section as string;
      const links = await storage.getFooterLinks(section);
      res.json(links);
    } catch (error) {
      console.error("Error fetching footer links:", error);
      res.status(500).json({ error: "Failed to fetch footer links" });
    }
  });

  // Get active announcements (public)
  app.get("/api/announcements", async (req, res) => {
    try {
      const announcements = await storage.getActiveAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  // Get platform wallet addresses (public) - Ethereum only
  app.get("/api/platform-wallets", async (req, res) => {
    try {
      const settings = await storage.getPlatformSettings("payment");
      const ethereumWalletSetting = settings.find(s => s.key === "ethereum_wallet_address");
      
      const wallets = {
        ethereum: ethereumWalletSetting?.value || "0x21e1f57a753fE27F7d8068002F65e8a830E2e6A8"
      };
      
      res.json(wallets);
    } catch (error) {
      console.error("Error fetching platform wallets:", error);
      res.status(500).json({ error: "Failed to fetch platform wallets" });
    }
  });

  // Get today's stats (for daily rewards page)
  app.get("/api/today-stats", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayStats = await storage.getTodayStats(today);
      res.json(todayStats);
    } catch (error) {
      console.error("Error fetching today's stats:", error);
      res.status(500).json({ error: "Failed to fetch today's stats" });
    }
  });

  // Admin: Get daily entries for a specific date
  app.get("/api/youhonor/daily-entries/:date", authenticateAdmin, async (req, res) => {
    try {
      const { date } = req.params;
      const entries = await storage.getDailyEntriesByDate(date);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching daily entries:", error);
      res.status(500).json({ error: "Failed to fetch daily entries" });
    }
  });

  // Admin: Get daily winner for a specific date
  app.get("/api/youhonor/daily-winner/:date", authenticateAdmin, async (req, res) => {
    try {
      const { date } = req.params;
      const winner = await storage.getDailyWinnerByDate(date);
      res.json(winner);
    } catch (error) {
      console.error("Error fetching daily winner:", error);
      res.status(500).json({ error: "Failed to fetch daily winner" });
    }
  });

  // Admin: Get daily reward statistics
  app.get("/api/youhonor/daily-stats", authenticateAdmin, async (req, res) => {
    try {
      const stats = await storage.getDailyRewardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching daily stats:", error);
      res.status(500).json({ error: "Failed to fetch daily stats" });
    }
  });

  // Admin: Get campaign with full company details (admin only)
  app.get("/api/youhonor/campaign/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      // Return full campaign details including company information for admin
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign for admin:", error);
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });

  // Admin: Get all campaigns with company information (admin only)
  app.get("/api/youhonor/campaigns", authenticateAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const campaigns = await storage.getCampaigns(limit, offset);
      
      // Return full campaign details including company information for admin
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns for admin:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // Admin: Select random winner
  app.post("/api/youhonor/select-random-winner", authenticateAdmin, async (req, res) => {
    try {
      const { date, amount } = req.body;
      const adminId = 1; // Default admin for demo
      
      // Check if winner already exists
      const existingWinner = await storage.getDailyWinnerByDate(date);
      if (existingWinner) {
        return res.status(400).json({ error: "Winner already selected for this date" });
      }

      // Get all entries for the date
      const entries = await storage.getDailyEntriesByDate(date);
      if (entries.length === 0) {
        return res.status(400).json({ error: "No entries found for this date" });
      }

      // Select random winner
      const randomIndex = Math.floor(Math.random() * entries.length);
      const selectedEntry = entries[randomIndex];

      // Create winner record
      const winner = await storage.createDailyWinner({
        wallet: selectedEntry.wallet,
        date,
        amount: amount || "100",
        selectedBy: adminId
      });

      res.json({ success: true, winner });
    } catch (error) {
      console.error("Error selecting random winner:", error);
      res.status(500).json({ error: "Failed to select random winner" });
    }
  });

  // Database Administration Routes
  app.get('/api/youhonor/database/:table', authenticateAdmin, async (req, res) => {
    try {
      const { table } = req.params;
      const { page = 1, limit = 50, search = '' } = req.query;
      
      const result = await storage.getTableData(table, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching table data:", error);
      res.status(500).json({ message: "Failed to fetch table data" });
    }
  });

  app.get('/api/youhonor/database/:table/stats', authenticateAdmin, async (req, res) => {
    try {
      const { table } = req.params;
      const stats = await storage.getTableStats(table);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching table stats:", error);
      res.status(500).json({ message: "Failed to fetch table stats" });
    }
  });

  app.post('/api/youhonor/database/:table', authenticateAdmin, async (req, res) => {
    try {
      const { table } = req.params;
      const data = req.body;
      const result = await storage.createRecord(table, data);
      
      // Log admin action
      await storage.createAdminLog({
        adminId: (req as any).admin.id,
        action: 'CREATE',
        details: { table, recordId: result.id, changes: data },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error creating record:", error);
      res.status(500).json({ message: "Failed to create record" });
    }
  });

  app.put('/api/youhonor/database/:table/:id', authenticateAdmin, async (req, res) => {
    try {
      const { table, id } = req.params;
      const data = req.body;
      const result = await storage.updateRecord(table, id, data);
      
      // Log admin action
      await storage.createAdminLog({
        adminId: (req as any).admin.id,
        action: 'UPDATE',
        details: { table, recordId: id, changes: data },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error updating record:", error);
      res.status(500).json({ message: "Failed to update record" });
    }
  });

  app.delete('/api/youhonor/database/:table/:id', authenticateAdmin, async (req, res) => {
    try {
      const { table, id } = req.params;
      await storage.deleteRecord(table, id);
      
      // Log admin action
      await storage.createAdminLog({
        adminId: (req as any).admin.id,
        action: 'DELETE',
        details: { table, recordId: id },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting record:", error);
      res.status(500).json({ message: "Failed to delete record" });
    }
  });

  app.get('/api/youhonor/database/:table/export', authenticateAdmin, async (req, res) => {
    try {
      const { table } = req.params;
      const data = await storage.exportTableData(table);
      
      // Log admin action
      await storage.createAdminLog({
        adminId: (req as any).admin.id,
        action: 'EXPORT',
        details: { table, exported: data.length + ' records' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.json(data);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Admin: Select manual winner
  app.post("/api/youhonor/select-manual-winner", authenticateAdmin, async (req, res) => {
    try {
      const { date, wallet, amount } = req.body;
      const adminId = 1; // Default admin for demo
      
      // Check if winner already exists
      const existingWinner = await storage.getDailyWinnerByDate(date);
      if (existingWinner) {
        return res.status(400).json({ error: "Winner already selected for this date" });
      }

      // Create winner record
      const winner = await storage.createDailyWinner({
        wallet,
        date,
        amount: amount || "100",
        selectedBy: adminId
      });

      res.json({ success: true, winner });
    } catch (error) {
      console.error("Error selecting manual winner:", error);
      res.status(500).json({ error: "Failed to select manual winner" });
    }
  });

  // Verify transaction (public - for frontend validation)
  app.post("/api/verify-transaction", async (req, res) => {
    try {
      const { network, txHash } = req.body;
      
      if (!network || !txHash) {
        return res.status(400).json({ error: "Network and transaction hash are required" });
      }

      const { verifyPayment } = await import("./blockchain");
      const networkFees = await storage.getActiveNetworkFees();
      const networkFee = networkFees.find(fee => fee.network === network);
      
      if (!networkFee) {
        return res.status(400).json({ error: "Network not supported" });
      }

      const settings = await storage.getPlatformSettings("payment");
      const platformWalletSetting = settings.find(s => s.key === `${network}_wallet_address`);
      
      if (!platformWalletSetting) {
        return res.status(400).json({ error: "Platform wallet not configured" });
      }

      const verification = await verifyPayment(
        network,
        txHash,
        networkFee.amount || "0",
        networkFee.tokenAddress || "",
        platformWalletSetting.value || ""
      );

      res.json({
        valid: verification.success,
        error: verification.error,
        amount: verification.amount,
        expectedAmount: networkFee.amount,
        tokenSymbol: networkFee.tokenSymbol
      });
    } catch (error) {
      console.error("Error verifying transaction:", error);
      res.status(500).json({ error: "Failed to verify transaction" });
    }
  });

  // ===== USER AUTHENTICATION ENDPOINTS (SIWE) =====
  
  // Generate nonce for wallet signature
  app.post("/auth/nonce", authRateLimit, async (req, res) => {
    try {
      const { wallet } = req.body;
      
      if (!wallet || !ethers.isAddress(wallet)) {
        return res.status(400).json({ error: "Valid wallet address is required" });
      }

      // Clean up expired nonces first
      await storage.cleanupExpiredNonces();

      // Generate random nonce
      const nonce = ethers.hexlify(ethers.randomBytes(16));
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      const userNonce = await storage.createUserNonce({
        wallet: wallet.toLowerCase(),
        nonce,
        expiresAt,
        used: false
      });

      res.json({ 
        nonce: userNonce.nonce,
        message: `Welcome to DUXXAN!\n\nPlease sign this message to authenticate your wallet.\n\nWallet: ${wallet.toLowerCase()}\nNonce: ${userNonce.nonce}\nTimestamp: ${userNonce.createdAt.toISOString()}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`
      });
    } catch (error) {
      console.error("Error generating nonce:", error);
      res.status(500).json({ error: "Failed to generate authentication nonce" });
    }
  });

  // Verify signature and create session
  app.post("/auth/verify", authRateLimit, async (req, res) => {
    try {
      const { wallet, signature, nonce } = req.body;
      
      if (!wallet || !signature || !nonce) {
        return res.status(400).json({ error: "Wallet address, signature, and nonce are required" });
      }

      if (!ethers.isAddress(wallet)) {
        return res.status(400).json({ error: "Invalid wallet address format" });
      }

      // Find the nonce
      const userNonce = await storage.getUserNonce(nonce);
      if (!userNonce) {
        return res.status(400).json({ error: "Invalid or expired nonce" });
      }

      // Verify that nonce belongs to this wallet
      if (userNonce.wallet !== wallet.toLowerCase()) {
        return res.status(400).json({ error: "Nonce does not match wallet address" });
      }

      // Reconstruct the message that was signed
      const message = `Welcome to DUXXAN!\n\nPlease sign this message to authenticate your wallet.\n\nWallet: ${wallet.toLowerCase()}\nNonce: ${nonce}\nTimestamp: ${new Date(userNonce.createdAt).toISOString()}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;

      try {
        // Verify the signature
        const recoveredAddress = ethers.verifyMessage(message, signature);
        
        if (recoveredAddress.toLowerCase() !== wallet.toLowerCase()) {
          return res.status(401).json({ error: "Invalid signature - wallet verification failed" });
        }
      } catch (sigError) {
        console.error("Signature verification error:", sigError);
        return res.status(401).json({ error: "Invalid signature format" });
      }

      // Mark nonce as used
      await storage.markNonceAsUsed(userNonce.id);

      // Create session
      const sessionId = ethers.hexlify(ethers.randomBytes(32));
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const session = await storage.createUserSession({
        sessionId,
        wallet: wallet.toLowerCase(),
        expiresAt,
        active: true,
        lastUsedAt: new Date()
      });

      // Create JWT token
      const token = jwt.sign(
        { 
          sessionId: session.sessionId, 
          wallet: session.wallet,
          type: 'user'
        },
        JWT_SECRET_VALIDATED,
        { expiresIn: '24h' }
      );

      // SECURITY FIX: Set JWT as httpOnly cookie instead of returning in response body
      res.cookie('user_auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({ 
        success: true, 
        wallet: session.wallet,
        expiresAt: session.expiresAt,
        message: "Successfully authenticated" 
      });

    } catch (error) {
      console.error("Error verifying signature:", error);
      res.status(500).json({ error: "Failed to verify authentication" });
    }
  });

  // Logout - invalidate session
  app.post("/auth/logout", authRateLimit, authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      await storage.invalidateUserSession(req.sessionId);
      
      // SECURITY FIX: Clear httpOnly authentication cookie
      res.clearCookie('user_auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      res.json({ success: true, message: "Successfully logged out" });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  // Get current user session info
  app.get("/auth/me", authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      const session = await storage.getUserSession(req.sessionId);
      if (!session) {
        return res.status(401).json({ error: "Invalid session" });
      }

      res.json({
        wallet: session.wallet,
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
        lastUsedAt: session.lastUsedAt,
        authenticated: true
      });
    } catch (error) {
      console.error("Error fetching user info:", error);
      res.status(500).json({ error: "Failed to fetch user information" });
    }
  });

  // Get authentication status (for checking if httpOnly cookie is valid)
  app.get("/auth/status", async (req, res) => {
    try {
      // Try to read JWT from httpOnly cookie
      const token = req.cookies.user_auth_token;
      if (!token) {
        return res.json({ authenticated: false });
      }

      // Verify the JWT token
      const decoded = jwt.verify(token, JWT_SECRET_VALIDATED) as any;
      if (!decoded.sessionId || !decoded.wallet) {
        return res.json({ authenticated: false });
      }

      // Verify session is still valid
      const session = await storage.getUserSession(decoded.sessionId);
      if (!session || !session.active || session.expiresAt <= new Date()) {
        return res.json({ authenticated: false });
      }

      res.json({ 
        authenticated: true,
        wallet: session.wallet
      });
    } catch (error) {
      // Invalid token or other error
      res.json({ authenticated: false });
    }
  });

  // ADMIN API ROUTES
  
  // Admin login
  app.post("/api/youhonor/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const admin = await storage.getAdminByUsername(username);
      if (!admin || !admin.active) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ adminId: admin.id }, JWT_SECRET_VALIDATED, { expiresIn: "24h" });
      
      // SECURITY FIX: Set JWT as httpOnly cookie instead of returning in response body
      res.cookie('admin_auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Log admin login
      await storage.createAdminLog({
        adminId: admin.id,
        action: "login",
        details: { ip: req.ip, userAgent: req.get('User-Agent') },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
        }
      });
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Admin me - Get current admin info
  app.get("/api/youhonor/me", authenticateAdmin, async (req, res) => {
    try {
      const admin = req.admin;
      res.json({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        active: admin.active,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
      });
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Admin logout
  app.post("/api/youhonor/logout", authenticateAdmin, async (req, res) => {
    try {
      const admin = req.admin;
      
      // Log admin logout
      await storage.createAdminLog({
        adminId: admin.id,
        action: "logout",
        details: { ip: req.ip, userAgent: req.get('User-Agent') },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // SECURITY FIX: Clear httpOnly authentication cookie
      res.clearCookie('admin_auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.json({
        success: true,
        message: "Logged out successfully"
      });
    } catch (error) {
      console.error("Error during admin logout:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // Admin dashboard statistics
  app.get("/api/youhonor/dashboard", authenticateAdmin, async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Admin - Get all campaigns
  app.get("/api/youhonor/campaigns", authenticateAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const campaigns = await storage.getCampaigns(limit, offset);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // Admin - Get pending campaigns
  app.get("/api/youhonor/campaigns/pending", authenticateAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getPendingCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching pending campaigns:", error);
      res.status(500).json({ error: "Failed to fetch pending campaigns" });
    }
  });

  // Admin - Approve campaign
  app.post("/api/youhonor/campaigns/:id/approve", authenticateAdmin, async (req: any, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      await storage.approveCampaign(campaignId, req.admin.id);
      
      // Log the action
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "approve_campaign",
        details: { campaignId },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error approving campaign:", error);
      res.status(500).json({ error: "Failed to approve campaign" });
    }
  });

  // Admin - Update campaign
  app.put("/api/youhonor/campaigns/:id", authenticateAdmin, async (req: any, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const updates = req.body;
      
      await storage.updateCampaign(campaignId, updates);
      
      // Log the action
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "update_campaign",
        details: { campaignId, updates },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  // Admin - Get all accounts
  app.get("/api/youhonor/accounts", authenticateAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const accounts = await storage.getAllAccounts(limit, offset);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  // Admin - Network fees management
  app.get("/api/youhonor/network-fees", authenticateAdmin, async (req, res) => {
    try {
      const fees = await storage.getNetworkFees();
      res.json(fees);
    } catch (error) {
      console.error("Error fetching network fees:", error);
      res.status(500).json({ error: "Failed to fetch network fees" });
    }
  });

  app.post("/api/youhonor/network-fees", authenticateAdmin, async (req: any, res) => {
    try {
      const feeData = insertNetworkFeeSchema.parse({
        ...req.body,
        updatedBy: req.admin.id,
      });
      
      const fee = await storage.createNetworkFee(feeData);
      
      // Log the action
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "create_network_fee",
        details: feeData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(fee);
    } catch (error) {
      console.error("Error creating network fee:", error);
      res.status(500).json({ error: "Failed to create network fee" });
    }
  });

  app.put("/api/youhonor/network-fees/:id", authenticateAdmin, async (req: any, res) => {
    try {
      const feeId = parseInt(req.params.id);
      const updates = { ...req.body, updatedBy: req.admin.id };
      
      await storage.updateNetworkFee(feeId, updates);
      
      // Log the action
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "update_network_fee",
        details: { feeId, updates },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating network fee:", error);
      res.status(500).json({ error: "Failed to update network fee" });
    }
  });

  // Admin - Platform settings
  app.get("/api/youhonor/settings", authenticateAdmin, async (req, res) => {
    try {
      const category = req.query.category as string;
      const settings = await storage.getPlatformSettings(category);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching platform settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/youhonor/settings", authenticateAdmin, async (req: any, res) => {
    try {
      const settingData = insertPlatformSettingSchema.parse({
        ...req.body,
        updatedBy: req.admin.id,
      });
      
      const setting = await storage.setPlatformSetting(settingData);
      
      // Log the action
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "update_platform_setting",
        details: settingData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(setting);
    } catch (error) {
      console.error("Error updating platform setting:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // Admin - Footer links management
  app.get("/api/youhonor/footer-links", authenticateAdmin, async (req, res) => {
    try {
      const section = req.query.section as string;
      const links = await storage.getFooterLinks(section);
      res.json(links);
    } catch (error) {
      console.error("Error fetching footer links:", error);
      res.status(500).json({ error: "Failed to fetch footer links" });
    }
  });

  app.post("/api/youhonor/footer-links", authenticateAdmin, async (req: any, res) => {
    try {
      const linkData = insertFooterLinkSchema.parse(req.body);
      const link = await storage.createFooterLink(linkData);
      
      // Log the action
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "create_footer_link",
        details: linkData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(link);
    } catch (error) {
      console.error("Error creating footer link:", error);
      res.status(500).json({ error: "Failed to create footer link" });
    }
  });

  app.put("/api/youhonor/footer-links/:id", authenticateAdmin, async (req: any, res) => {
    try {
      const linkId = parseInt(req.params.id);
      const updates = req.body;
      
      await storage.updateFooterLink(linkId, updates);
      
      // Log the action
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "update_footer_link",
        details: { linkId, updates },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating footer link:", error);
      res.status(500).json({ error: "Failed to update footer link" });
    }
  });

  app.delete("/api/youhonor/footer-links/:id", authenticateAdmin, async (req: any, res) => {
    try {
      const linkId = parseInt(req.params.id);
      
      await storage.deleteFooterLink(linkId);
      
      // Log the action
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "delete_footer_link",
        details: { linkId },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting footer link:", error);
      res.status(500).json({ error: "Failed to delete footer link" });
    }
  });

  // Admin - Announcements management
  app.get("/api/youhonor/announcements", authenticateAdmin, async (req, res) => {
    try {
      const announcements = await storage.getAllAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.post("/api/youhonor/announcements", authenticateAdmin, async (req: any, res) => {
    try {
      const announcementData = insertAnnouncementSchema.parse({
        ...req.body,
        createdBy: req.admin.id,
      });
      
      const announcement = await storage.createAnnouncement(announcementData);
      
      // Log the action
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "create_announcement",
        details: announcementData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ error: "Failed to create announcement" });
    }
  });

  app.put("/api/youhonor/announcements/:id", authenticateAdmin, async (req: any, res) => {
    try {
      const announcementId = parseInt(req.params.id);
      const updates = req.body;
      
      await storage.updateAnnouncement(announcementId, updates);
      
      // Log the action
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "update_announcement",
        details: { announcementId, updates },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating announcement:", error);
      res.status(500).json({ error: "Failed to update announcement" });
    }
  });

  app.delete("/api/youhonor/announcements/:id", authenticateAdmin, async (req: any, res) => {
    try {
      const announcementId = parseInt(req.params.id);
      
      await storage.deleteAnnouncement(announcementId);
      
      // Log the action
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "delete_announcement",
        details: { announcementId },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting announcement:", error);
      res.status(500).json({ error: "Failed to delete announcement" });
    }
  });

  // Admin - Daily winners management
  app.get("/api/youhonor/daily-winners", authenticateAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const winners = await storage.getDailyWinners(limit);
      res.json(winners);
    } catch (error) {
      console.error("Error fetching daily winners:", error);
      res.status(500).json({ error: "Failed to fetch daily winners" });
    }
  });

  app.post("/api/youhonor/daily-winners", authenticateAdmin, async (req: any, res) => {
    try {
      const winnerData = insertDailyWinnerSchema.parse({
        ...req.body,
        selectedBy: req.admin.id,
      });
      
      const winner = await storage.createDailyWinner(winnerData);
      
      // Log the action
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "select_daily_winner",
        details: winnerData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(winner);
    } catch (error) {
      console.error("Error creating daily winner:", error);
      res.status(500).json({ error: "Failed to create daily winner" });
    }
  });

  // Admin - Activity logs
  app.get("/api/youhonor/logs", authenticateAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const adminId = req.query.adminId ? parseInt(req.query.adminId as string) : undefined;
      const logs = await storage.getAdminLogs(adminId, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching admin logs:", error);
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  // MoonPay custom payment processing
  app.post('/api/moonpay-purchase', async (req, res) => {
    try {
      const { amount, currency, targetCurrency, walletAddress, paymentMethod, cardDetails } = req.body;
      
      if (!process.env.VITE_MOONPAY_API_KEY) {
        return res.status(500).json({ error: 'MoonPay API key not configured' });
      }

      // Simulate MoonPay API integration
      // In production, this would call actual MoonPay API
      
      // Basic validation
      if (!amount || !walletAddress || !targetCurrency) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (paymentMethod === 'card' && (!cardDetails?.number || !cardDetails?.expiry || !cardDetails?.cvv)) {
        return res.status(400).json({ error: 'Invalid card details' });
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate success response
      const transactionId = `mp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      res.json({
        success: true,
        transactionId,
        amount,
        targetCurrency,
        walletAddress,
        status: 'completed',
        message: 'Payment processed successfully'
      });

    } catch (error) {
      console.error('MoonPay purchase error:', error);
      res.status(500).json({ error: 'Payment processing failed' });
    }
  });

  // Get all settings as key-value pairs (public)
  app.get("/api/settings-map", async (req, res) => {
    try {
      const settings = await storage.getPlatformSettings();
      const settingsMap: Record<string, string> = {};
      
      settings.forEach(setting => {
        settingsMap[setting.key] = setting.value || '';
      });
      
      res.json(settingsMap);
    } catch (error) {
      console.error("Error fetching settings map:", error);
      res.status(500).json({ error: "Failed to fetch settings map" });
    }
  });

  // Update platform setting (admin only)
  app.put("/api/youhonor/settings/:key", authenticateAdmin, async (req: any, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const adminId = req.admin?.id;

      if (value === undefined) {
        return res.status(400).json({ error: "Value is required" });
      }

      await storage.updatePlatformSetting(key, value, adminId);
      
      // Log admin action
      await storage.createAdminLog({
        adminId,
        action: "update_setting",
        details: `Updated setting ${key} to: ${value}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ success: true, message: "Setting updated successfully" });
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // Create new platform setting (admin only)
  app.post("/api/youhonor/settings-new", authenticateAdmin, async (req: any, res) => {
    try {
      const settingData = insertPlatformSettingSchema.parse({
        ...req.body,
        updatedBy: req.admin.id
      });
      
      const setting = await storage.setPlatformSetting(settingData);
      
      // Log admin action
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "create_setting",
        details: `Created setting ${settingData.key}: ${settingData.value}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(setting);
    } catch (error) {
      console.error("Error creating setting:", error);
      res.status(500).json({ error: "Failed to create setting" });
    }
  });

  // Get all settings with categories for admin panel (admin only) 
  app.get("/api/youhonor/settings-categorized", authenticateAdmin, async (req, res) => {
    try {
      const settings = await storage.getPlatformSettings();
      
      // Group settings by category
      const categorizedSettings: Record<string, any[]> = {};
      settings.forEach(setting => {
        const category = setting.category || 'general';
        if (!categorizedSettings[category]) {
          categorizedSettings[category] = [];
        }
        categorizedSettings[category].push(setting);
      });

      res.json(categorizedSettings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // ===== ADMIN COMPREHENSIVE ENDPOINTS =====

  // Footer Links Management
  app.get("/api/youhonor/footer-links", authenticateAdmin, async (req, res) => {
    try {
      const links = await storage.getFooterLinks();
      res.json(links);
    } catch (error) {
      console.error("Error fetching footer links:", error);
      res.status(500).json({ error: "Failed to fetch footer links" });
    }
  });

  app.post("/api/youhonor/footer-links", authenticateAdmin, async (req: any, res) => {
    try {
      const linkData = insertFooterLinkSchema.parse(req.body);
      const link = await storage.createFooterLink(linkData);
      
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "create_footer_link",
        details: `Created footer link: ${linkData.title}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(link);
    } catch (error) {
      console.error("Error creating footer link:", error);
      res.status(500).json({ error: "Failed to create footer link" });
    }
  });

  app.put("/api/youhonor/footer-links/:id", authenticateAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const linkData = insertFooterLinkSchema.parse(req.body);
      const link = await storage.updateFooterLink(parseInt(id), linkData);
      
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "update_footer_link",
        details: `Updated footer link ID ${id}: ${linkData.title}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(link);
    } catch (error) {
      console.error("Error updating footer link:", error);
      res.status(500).json({ error: "Failed to update footer link" });
    }
  });

  app.delete("/api/youhonor/footer-links/:id", authenticateAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFooterLink(parseInt(id));
      
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "delete_footer_link",
        details: `Deleted footer link ID ${id}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting footer link:", error);
      res.status(500).json({ error: "Failed to delete footer link" });
    }
  });

  // Transactions Management
  app.get("/api/youhonor/transactions", authenticateAdmin, async (req, res) => {
    try {
      const { status, token, address, dateRange, page = 1, limit = 20 } = req.query;
      const filters = { status, token, address, dateRange };
      const transactions = await storage.getTransactions(filters, parseInt(page as string), parseInt(limit as string));
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/youhonor/transactions/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const transaction = await storage.getTransaction(parseInt(id));
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  });

  // Wallets Management
  app.get("/api/youhonor/wallets", authenticateAdmin, async (req, res) => {
    try {
      const { ownerType, ownerId, address, page = 1, limit = 50 } = req.query;
      const filters = { ownerType, ownerId, address };
      const wallets = await storage.getWallets(filters, parseInt(page as string), parseInt(limit as string));
      res.json(wallets);
    } catch (error) {
      console.error("Error fetching wallets:", error);
      res.status(500).json({ error: "Failed to fetch wallets" });
    }
  });

  // Balances Summary
  app.get("/api/youhonor/balances/summary", authenticateAdmin, async (req, res) => {
    try {
      const { scope, id } = req.query;
      const summary = await storage.getBalancesSummary(scope as string, id as string);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching balances summary:", error);
      res.status(500).json({ error: "Failed to fetch balances summary" });
    }
  });

  // Daily Rewards Management
  app.get("/api/youhonor/daily-reward", authenticateAdmin, async (req, res) => {
    try {
      const { page = 1, limit = 30 } = req.query;
      const dailyRewards = await storage.getDailyRewards(parseInt(page as string), parseInt(limit as string));
      res.json(dailyRewards);
    } catch (error) {
      console.error("Error fetching daily rewards:", error);
      res.status(500).json({ error: "Failed to fetch daily rewards" });
    }
  });

  app.post("/api/youhonor/daily-reward/:id/amount", authenticateAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;
      await storage.updateDailyRewardAmount(parseInt(id), amount);
      
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "update_daily_reward_amount",
        details: `Updated daily reward ${id} amount to ${amount} USDT`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating daily reward amount:", error);
      res.status(500).json({ error: "Failed to update daily reward amount" });
    }
  });

  app.get("/api/youhonor/daily-reward/:id/participants", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const participants = await storage.getDailyRewardParticipants(parseInt(id));
      res.json(participants);
    } catch (error) {
      console.error("Error fetching daily reward participants:", error);
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  app.post("/api/youhonor/daily-reward/:id/winner", authenticateAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { wallet } = req.body;
      await storage.setDailyRewardWinner(parseInt(id), wallet, req.admin.id);
      
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "select_daily_winner",
        details: `Selected winner ${wallet} for daily reward ${id}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error setting daily reward winner:", error);
      res.status(500).json({ error: "Failed to set winner" });
    }
  });

  app.post("/api/youhonor/daily-reward/:id/close", authenticateAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.closeDailyReward(parseInt(id));
      
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "close_daily_reward",
        details: `Closed daily reward ${id}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error closing daily reward:", error);
      res.status(500).json({ error: "Failed to close daily reward" });
    }
  });

  app.post("/api/youhonor/daily-reward/:id/open", authenticateAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.openDailyReward(parseInt(id));
      
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "open_daily_reward",
        details: `Opened daily reward ${id}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error opening daily reward:", error);
      res.status(500).json({ error: "Failed to open daily reward" });
    }
  });

  // Campaigns Management
  app.get("/api/youhonor/campaigns", authenticateAdmin, async (req, res) => {
    try {
      const { status, type, page = 1, limit = 20 } = req.query;
      const filters = { status, type };
      const campaigns = await storage.getAdminCampaigns(filters, parseInt(page as string), parseInt(limit as string));
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching admin campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/youhonor/campaigns/:id/approve", authenticateAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.approveCampaign(parseInt(id), req.admin.id);
      
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "approve_campaign",
        details: `Approved campaign ID ${id}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error approving campaign:", error);
      res.status(500).json({ error: "Failed to approve campaign" });
    }
  });

  app.post("/api/youhonor/campaigns/:id/reject", authenticateAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.rejectCampaign(parseInt(id), req.admin.id);
      
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "reject_campaign",
        details: `Rejected campaign ID ${id}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting campaign:", error);
      res.status(500).json({ error: "Failed to reject campaign" });
    }
  });

  app.post("/api/youhonor/campaigns/:id/toggle-company-hide", authenticateAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.toggleCampaignCompanyVisibility(parseInt(id));
      
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "toggle_campaign_company_visibility",
        details: `Toggled company visibility for campaign ID ${id}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error toggling campaign company visibility:", error);
      res.status(500).json({ error: "Failed to toggle company visibility" });
    }
  });




  // Activity Logs
  app.get("/api/youhonor/logs", authenticateAdmin, async (req, res) => {
    try {
      const { adminId, action, page = 1, limit = 50 } = req.query;
      const filters = { adminId, action };
      const logs = await storage.getAdminLogs(filters, parseInt(page as string), parseInt(limit as string));
      res.json(logs);
    } catch (error) {
      console.error("Error fetching admin logs:", error);
      res.status(500).json({ error: "Failed to fetch admin logs" });
    }
  });

  // Get credit card collateral info (public)
  app.get("/api/credit-card-info", async (req, res) => {
    try {
      // Get credit card settings from payments category
      const paymentsSettings = await storage.getPlatformSettings("payments");
      const collateralAmountSetting = paymentsSettings.find(s => s.key === 'credit_card_collateral_amount');
      const collateralTokenSetting = paymentsSettings.find(s => s.key === 'credit_card_collateral_token');
      const enabledSetting = paymentsSettings.find(s => s.key === 'credit_card_enabled');
      
      // Get platform wallet from payment category (different category)
      const paymentSettings = await storage.getPlatformSettings("payment");
      const platformWalletSetting = paymentSettings.find(s => s.key === 'ethereum_wallet_address');
      
      
      res.json({
        collateralAmount: parseFloat(collateralAmountSetting?.value || '2'),
        collateralToken: collateralTokenSetting?.value || 'USDT',
        enabled: enabledSetting?.value === 'true',
        platformWallet: platformWalletSetting?.value || '0x21e1f57a753fE27F7d8068002F65e8a830E2e6A8'
      });
    } catch (error) {
      console.error('Error fetching credit card info:', error);
      res.status(500).json({ error: 'Failed to fetch credit card info' });
    }
  });

  // Auto select daily winner (admin only)
  const autoSelectWinnerSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional()
  });
  
  app.post("/api/youhonor/auto-select-daily-winner", authenticateAdmin, async (req: any, res) => {
    try {
      const validation = autoSelectWinnerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request data", details: validation.error.errors });
      }
      
      const { date } = validation.data;
      const adminId = req.admin.id;
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      // Check if winner already selected for this date
      const existingWinner = await storage.getDailyWinnerByDate(targetDate);
      if (existingWinner) {
        return res.status(400).json({ error: "Winner already selected for this date" });
      }
      
      // Get all entries for target date
      const entries = await storage.getDailyEntriesByDate(targetDate);
      if (entries.length === 0) {
        return res.status(400).json({ error: "No participants found for this date" });
      }
      
      // Select random winner
      const randomIndex = Math.floor(Math.random() * entries.length);
      const selectedEntry = entries[randomIndex];
      
      // Get reward amount from settings
      const rewardSettings = await storage.getPlatformSettings("rewards");
      const rewardAmountSetting = rewardSettings.find(s => s.key === "daily_reward_amount");
      const rewardAmount = rewardAmountSetting?.value || "10";
      
      // Create winner record
      const winner = await storage.createDailyWinner({
        wallet: selectedEntry.wallet,
        date: targetDate,
        amount: rewardAmount,
        selectedBy: adminId
      });
      
      // Log admin action
      await storage.createAdminLog({
        adminId,
        action: "auto_select_daily_winner",
        details: {
          date: targetDate,
          winnerWallet: selectedEntry.wallet,
          rewardAmount,
          totalParticipants: entries.length
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.json({ 
        success: true, 
        winner,
        totalParticipants: entries.length,
        message: `Winner selected from ${entries.length} participants` 
      });
    } catch (error) {
      console.error("Error auto-selecting daily winner:", error);
      res.status(500).json({ error: "Failed to select daily winner" });
    }
  });

  // ===== PENDING PAYMENTS ROUTES (AUTO CAMPAIGN CREATION) =====
  
  // Add pending payment (public - for frontend timeout handling)
  app.post("/api/pending-payments", async (req, res) => {
    try {
      const paymentData = insertPendingPaymentSchema.parse(req.body);
      
      // Security: Validate transaction hash format
      if (paymentData.txHash && !/^0x[a-fA-F0-9]{64}$/.test(paymentData.txHash)) {
        return res.status(400).json({ error: "Invalid transaction hash format" });
      }
      
      // Check for duplicates
      if (paymentData.txHash) {
        const existing = await storage.getPendingByTxHash(paymentData.txHash);
        if (existing) {
          return res.status(409).json({ error: "Pending payment already exists for this transaction" });
        }
      }
      
      const pendingPayment = await storage.addPendingPayment(paymentData);
      res.json(pendingPayment);
    } catch (error) {
      console.error("Error adding pending payment:", error);
      res.status(500).json({ error: "Failed to add pending payment" });
    }
  });

  // Get pending payments (admin only - for monitoring)
  app.get("/api/youhonor/pending-payments", authenticateAdmin, async (req: any, res) => {
    try {
      const status = req.query.status as string;
      const payments = await storage.getPendingPayments(status);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      res.status(500).json({ error: "Failed to fetch pending payments" });
    }
  });

  // Update pending payment status (admin only)
  app.put("/api/youhonor/pending-payments/:id", authenticateAdmin, async (req: any, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      if (isNaN(paymentId)) {
        return res.status(400).json({ error: "Invalid payment ID" });
      }
      
      const updates = req.body;
      await storage.updatePendingPayment(paymentId, updates);
      
      // Log the action
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "update_pending_payment",
        details: { paymentId, updates },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating pending payment:", error);
      res.status(500).json({ error: "Failed to update pending payment" });
    }
  });

  // Check pending payment by transaction hash (public - for frontend polling)
  app.get("/api/pending-payments/check/:txHash", async (req, res) => {
    try {
      const { txHash } = req.params;
      
      // Security: Validate transaction hash format
      if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
        return res.status(400).json({ error: "Invalid transaction hash format" });
      }
      
      const payment = await storage.getPendingByTxHash(txHash);
      if (!payment) {
        return res.status(404).json({ error: "Pending payment not found" });
      }
      
      res.json(payment);
    } catch (error) {
      console.error("Error checking pending payment:", error);
      res.status(500).json({ error: "Failed to check pending payment" });
    }
  });

  // Reconcile specific failed transaction (public - for failed tx recovery with security)
  app.post("/api/pending-payments/reconcile/:txHash", async (req, res) => {
    try {
      const { txHash } = req.params;
      
      // Security: Validate transaction hash format
      if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
        return res.status(400).json({ error: "Invalid transaction hash format" });
      }
      
      console.log(`🔧 Reconciling failed transaction: ${txHash}`);
      
      // SECURITY: Check if transaction was already processed to prevent replay attacks
      const existingCampaign = await storage.getCampaignByTxHash(txHash);
      if (existingCampaign) {
        console.log(`⚠️ Transaction already processed - campaign exists: ${existingCampaign.id}`);
        return res.status(409).json({ 
          error: "Transaction already processed", 
          campaignId: existingCampaign.id,
          status: 'already_processed'
        });
      }
      
      // Import blockchain utilities
      const { checkPendingPayment, processPendingPayment, verifyPayment } = await import("./blockchain");
      
      // First check if PendingPayment exists for this txHash
      let pendingPayment = await storage.getPendingByTxHash(txHash);
      
      if (!pendingPayment) {
        console.log(`⚠️ No pending payment found for tx: ${txHash}, creating from request...`);
        
        // Create PendingPayment from request body if it doesn't exist
        const { ownerWallet, expectedAmount, chainId, platformWallet, formData } = req.body;
        
        if (!ownerWallet || !expectedAmount || !formData) {
          return res.status(400).json({ 
            error: "Missing required fields: ownerWallet, expectedAmount, formData" 
          });
        }
        
        // SECURITY: Validate wallet ownership by verifying the transaction on-chain
        const verification = await verifyPayment(
          'ethereum', // network
          txHash,
          expectedAmount.toString(),
          '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT token address
          platformWallet || '0x21e1f57a753fE27F7d8068002F65e8a830E2e6A8' // platform wallet
        );
        
        if (!verification.success) {
          console.log(`❌ Transaction verification failed: ${verification.error}`);
          return res.status(400).json({ 
            error: "Transaction verification failed", 
            details: verification.error 
          });
        }
        
        if (!verification.confirmed) {
          console.log(`❌ Transaction not confirmed: ${txHash}`);
          return res.status(400).json({ 
            error: "Transaction not confirmed on blockchain" 
          });
        }
        
        pendingPayment = await storage.addPendingPayment({
          ownerWallet,
          expectedAmount: expectedAmount.toString(),
          chainId: chainId || 1,
          platformWallet: platformWallet || '0x21e1f57a753fE27F7d8068002F65e8a830E2e6A8',
          tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
          txHash,
          status: 'pending',
          formData
        });
        
        console.log(`✅ Created PendingPayment for reconciliation: ${pendingPayment.id}`);
      } else {
        // SECURITY: Verify wallet ownership for existing PendingPayment
        const { ownerWallet } = req.body;
        if (ownerWallet && pendingPayment.ownerWallet !== ownerWallet) {
          console.log(`❌ Wallet ownership mismatch: ${ownerWallet} vs ${pendingPayment.ownerWallet}`);
          return res.status(403).json({ 
            error: "Wallet ownership verification failed" 
          });
        }
        
        // SECURITY: Only allow reconciliation of pending/failed payments
        if (pendingPayment.status === 'completed') {
          console.log(`⚠️ Payment already completed: ${txHash}`);
          return res.status(409).json({ 
            error: "Payment already completed", 
            status: 'already_completed'
          });
        }
      }
      
      // Verify and process the payment
      const checkResult = await checkPendingPayment(pendingPayment);
      
      if (checkResult.success && checkResult.confirmed) {
        console.log(`✅ Transaction confirmed during reconciliation: ${txHash}`);
        
        const processResult = await processPendingPayment(pendingPayment, checkResult.verificationResult);
        
        if (processResult.success) {
          res.json({
            success: true,
            status: 'confirmed',
            campaignId: processResult.campaignId,
            message: 'Transaction successfully reconciled and campaign created'
          });
        } else {
          res.status(500).json({
            success: false,
            status: 'processing_failed',
            error: processResult.error
          });
        }
      } else {
        console.log(`❌ Transaction not confirmed during reconciliation: ${txHash}`);
        res.json({
          success: false,
          status: 'not_confirmed',
          error: checkResult.verificationResult?.error || 'Transaction not yet confirmed on blockchain',
          message: 'Transaction found but not yet confirmed. Please wait for more confirmations.'
        });
      }
      
    } catch (error) {
      console.error("Error reconciling transaction:", error);
      res.status(500).json({ error: "Failed to reconcile transaction" });
    }
  });

  // Virtual POS endpoint - Always returns insufficient balance error after 5 seconds
  const virtualPosSchema = z.object({
    bin: z.string().regex(/^\d{6,8}$/, 'BIN must be 6-8 digits'), // First 6-8 digits (digits only)
    last4: z.string().regex(/^\d{4}$/, 'Last 4 must be exactly 4 digits'), // Last 4 digits (digits only)
    brand: z.enum(['visa', 'mastercard', 'amex', 'discover', 'unknown']),
    expMonth: z.coerce.number().min(1).max(12), // Handle string inputs from frontend
    expYear: z.coerce.number().min(new Date().getFullYear()).max(2050), // Dynamic year validation
    amount: z.coerce.number().positive(),
    currency: z.string().default('USD'),
    cvvLength: z.coerce.number().min(3).max(4),
  });

  app.post("/api/virtual-pos/authorize", async (req, res) => {
    try {
      // Validate request body (no sensitive data)
      const validatedData = virtualPosSchema.parse(req.body);
      
      console.log(`🏦 Virtual POS authorization attempt: ${validatedData.brand} ****${validatedData.last4} for $${validatedData.amount}`);
      
      // Simulate 5-second processing delay as requested
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Always return insufficient balance error as specified
      console.log(`❌ Virtual POS: Returning insufficient balance for ****${validatedData.last4}`);
      
      res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_FUNDS',
        message: 'Bakiye Yetersiz',
        details: 'Kartınızda yeterli bakiye bulunmamaktadır. Lütfen başka bir kart deneyin veya bakiyenizi kontrol edin.',
        timestamp: new Date().toISOString(),
        transactionId: `VPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log(`⚠️ Virtual POS validation error:`, error.errors);
        res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Geçersiz kart bilgileri',
          errors: error.errors,
        });
      } else {
        console.error("🚨 Virtual POS processing error:", error);
        res.status(500).json({
          success: false,
          code: 'PROCESSING_ERROR',
          message: 'İşlem hatası oluştu',
          details: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
        });
      }
    }
  });

  // ===== KYB (Know Your Business) ENDPOINTS =====
  
  // Multer setup for document uploads
  const upload = multer({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf' || 
          file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF and image files are allowed'));
      }
    }
  });
  
  // Create corporate verification
  app.post("/api/kyb/create-verification", async (req: Request, res) => {
    try {
      console.log("🔍 KYB Verification - Raw request body:", JSON.stringify(req.body, null, 2));
      
      const {
        companyName,
        companyRegistrationNumber,
        companyEmail,
        companyCEO,
        companyIndustry,
        companyPhone,
        companyAddress,
        companyWebsite,
        companyEmployeeCount,
        wallet,
        ...otherData
      } = req.body;
      
      console.log("🔍 KYB Verification - Extracted fields:", {
        companyName,
        companyRegistrationNumber,
        companyEmail,
        companyCEO,
        companyIndustry,
        companyPhone,
        companyAddress,
        companyWebsite,
        companyEmployeeCount,
        wallet
      });
      
      // Basic validation
      if (!companyName || !companyEmail || !wallet || !companyCEO) {
        console.error("❌ KYB Validation failed:", { companyName: !!companyName, companyEmail: !!companyEmail, wallet: !!wallet, companyCEO: !!companyCEO });
        return res.status(400).json({ error: "Company name, email, CEO name, and wallet address are required" });
      }
      
      // Map frontend field names to database field names
      const verificationData = {
        companyName,
        companyRegistrationNumber,
        companyEmail,
        contactPersonName: companyCEO, // Map companyCEO to contactPersonName
        contactPersonTitle: "CEO/Founder", // Set default title
        companyPhone,
        companyAddress,
        companyWebsite,
        wallet,
        status: 'pending',
        submittedAt: new Date(),
        ...otherData
      };
      
      console.log("🔍 KYB Verification - Final verificationData being sent to DB:", JSON.stringify(verificationData, null, 2));
      
      const verification = await storage.createCorporateVerification(verificationData);
      
      console.log(`🏢 New corporate verification created: ${verification.id} for ${verification.companyName} (${verification.wallet})`);
      res.json(verification);
    } catch (error) {
      console.error("KYB verification creation error:", error);
      res.status(500).json({ error: "Failed to create verification" });
    }
  });

  // GET /api/kyb/status - Get KYB verification status for wallet
  app.get("/api/kyb/status", authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      const userWallet = req.userWallet;
      if (!userWallet) {
        return res.status(401).json({ error: "Wallet authentication required" });
      }

      const verification = await storage.getCorporateVerification(userWallet);
      
      if (!verification) {
        return res.json({
          status: 'NOT_STARTED',
          hasKYB: false,
          verificationId: null
        });
      }

      res.json({
        status: verification.status.toUpperCase(),
        hasKYB: true,
        verificationId: verification.id,
        submittedAt: verification.submittedAt,
        reviewedAt: verification.reviewedAt,
        reviewedBy: verification.reviewedBy,
        reviewNotes: verification.reviewNotes
      });
    } catch (error) {
      console.error("Error fetching KYB status:", error);
      res.status(500).json({ error: "Failed to fetch KYB status" });
    }
  });

  // GET /api/company/profile - Get approved company profile for wallet
  app.get("/api/company/profile", authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      const userWallet = req.userWallet;
      if (!userWallet) {
        return res.status(401).json({ error: "Wallet authentication required" });
      }

      const verification = await storage.getCorporateVerification(userWallet);
      
      if (!verification || verification.status !== 'approved') {
        return res.status(404).json({ error: "No approved company profile found" });
      }

      // Return company profile data (excluding sensitive admin fields)
      res.json({
        id: verification.id,
        companyName: verification.companyName,
        companyRegistrationNumber: verification.companyRegistrationNumber,
        companyAddress: verification.companyAddress,
        companyWebsite: verification.companyWebsite,
        companyEmail: verification.companyEmail,
        companyPhone: verification.companyPhone,
        contactPersonName: verification.contactPersonName,
        contactPersonTitle: verification.contactPersonTitle,
        companyIndustry: verification.companyIndustry,
        companyEmployeeCount: verification.companyEmployeeCount,
        companyFoundedYear: verification.companyFoundedYear,
        wallet: verification.wallet,
        approvedAt: verification.reviewedAt
      });
    } catch (error) {
      console.error("Error fetching company profile:", error);
      res.status(500).json({ error: "Failed to fetch company profile" });
    }
  });

  // GET /api/pricing - Get database-driven pricing for different purposes
  app.get("/api/pricing", async (req: Request, res) => {
    try {
      const { purpose } = req.query;
      
      if (!purpose) {
        return res.status(400).json({ error: "Purpose parameter is required" });
      }

      // Get platform settings for pricing
      const settingsMap = await storage.getSettingsMap();
      
      let pricing;
      switch (purpose) {
        case 'fund_collateral':
          pricing = {
            amount: parseFloat(settingsMap.fund_collateral_amount || '1'),
            token: settingsMap.fund_collateral_token || 'USDT',
            decimals: 18,
            platformWallet: settingsMap.platform_wallet || '0x21e1f57a753fE27F7d8068002F65e8a830E2e6A8'
          };
          break;
        case 'account_activation':
          pricing = {
            amount: parseFloat(settingsMap.account_activation_fee || '50'),
            token: settingsMap.account_activation_token || 'USDT',
            decimals: 18,
            platformWallet: settingsMap.platform_wallet || '0x21e1f57a753fE27F7d8068002F65e8a830E2e6A8'
          };
          break;
        case 'daily_reward':
          pricing = {
            amount: parseFloat(settingsMap.daily_reward_amount || '100'),
            token: settingsMap.daily_reward_token || 'USDT',
            decimals: 18,
            platformWallet: settingsMap.platform_wallet || '0x21e1f57a753fE27F7d8068002F65e8a830E2e6A8'
          };
          break;
        default:
          return res.status(400).json({ error: "Invalid purpose. Supported: fund_collateral, account_activation, daily_reward" });
      }

      res.json({
        success: true,
        purpose,
        pricing
      });
    } catch (error) {
      console.error("Error fetching pricing:", error);
      res.status(500).json({ error: "Failed to fetch pricing" });
    }
  });

  // Upload document for verification
  app.post("/api/kyb/upload-document", upload.single('file'), async (req: Request, res) => {
    try {
      const { documentType, verificationId, wallet } = req.body;
      const file = req.file;
      
      if (!documentType || !verificationId || !file || !wallet) {
        return res.status(400).json({ error: "documentType, verificationId, wallet, and file are required" });
      }

      // Verify the verification exists and belongs to the wallet
      const verification = await storage.getCorporateVerificationById(parseInt(verificationId));
      if (!verification || verification.wallet !== wallet) {
        return res.status(403).json({ error: "Access denied to this verification" });
      }

      // Store document metadata (in production, file would be uploaded to cloud storage)
      const document = await storage.uploadFundDocument({
        verificationId: parseInt(verificationId),
        documentType: documentType as any,
        fileName: file.originalname,
        fileUrl: `/uploads/kyb/${verificationId}/${documentType}_${Date.now()}_${file.originalname}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: wallet,
      });

      console.log(`📄 Document uploaded: ${document.fileName} for verification ${verificationId} (${wallet})`);
      res.json(document);
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Create pending fund
  app.post("/api/kyb/create-pending-fund", async (req: Request, res) => {
    try {
      const fundData = req.body;
      
      // Validate required fields
      if (!fundData.verificationId || !fundData.title || !fundData.wallet) {
        return res.status(400).json({ error: "verificationId, title, and wallet are required" });
      }
      
      // Verify the verification belongs to the wallet
      const verification = await storage.getCorporateVerificationById(fundData.verificationId);
      if (!verification || verification.wallet !== fundData.wallet) {
        return res.status(403).json({ error: "Access denied to this verification" });
      }
      
      // Get collateral amount from settings
      const collateralSetting = await storage.getPlatformSetting('fund_collateral_amount');
      const collateralAmount = collateralSetting?.value || "100";
      
      const pendingFund = await storage.createPendingFund({
        wallet: fundData.wallet,
        campaignData: fundData,
        verificationId: fundData.verificationId,
        collateralAmount,
        status: 'draft',
      });

      console.log(`💰 Pending fund created: ${pendingFund.id} for wallet ${fundData.wallet}`);
      res.json(pendingFund);
    } catch (error) {
      console.error("Pending fund creation error:", error);
      res.status(500).json({ error: "Failed to create pending fund" });
    }
  });

  // Confirm collateral payment
  app.post("/api/kyb/confirm-payment", authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      const { pendingFundId, txHash, amount } = req.body;
      
      if (!pendingFundId || !txHash) {
        return res.status(400).json({ error: "pendingFundId and txHash are required" });
      }
      
      // Basic txHash format validation
      if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
        return res.status(400).json({ error: "Invalid transaction hash format" });
      }
      
      // Verify the pending fund belongs to the authenticated user
      const pendingFund = await storage.getPendingFund(pendingFundId);
      if (!pendingFund || pendingFund.wallet !== req.userWallet) {
        return res.status(403).json({ error: "Access denied to this pending fund" });
      }

      await storage.updatePendingFund(pendingFundId, {
        collateralPaid: true,
        collateralTxHash: txHash,
        status: 'awaiting_review',
        updatedAt: new Date(),
      });

      console.log(`✅ Payment confirmed for pending fund ${pendingFundId}: ${txHash}`);
      res.json({ success: true, message: "Payment confirmed" });
    } catch (error) {
      console.error("Payment confirmation error:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // Get corporate verification status
  app.get("/api/kyb/verification-status/:wallet", authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      const { wallet } = req.params;
      
      // Users can only access their own verification status
      if (wallet !== req.userWallet) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const verification = await storage.getCorporateVerification(wallet);
      
      if (!verification) {
        return res.status(404).json({ error: "Verification not found" });
      }

      res.json(verification);
    } catch (error) {
      console.error("Verification status error:", error);
      res.status(500).json({ error: "Failed to get verification status" });
    }
  });

  // Get pending funds for wallet
  app.get("/api/kyb/pending-funds/:wallet", authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      const { wallet } = req.params;
      
      // Users can only access their own pending funds
      if (wallet !== req.userWallet) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const pendingFunds = await storage.getPendingFundsByWallet(wallet);
      res.json(pendingFunds);
    } catch (error) {
      console.error("Pending funds error:", error);
      res.status(500).json({ error: "Failed to get pending funds" });
    }
  });

  // ===== FUNDS WITH VERIFICATION STATUS ENDPOINT =====
  
  // Get FUND campaigns with verification status
  app.get("/api/get-fund-campaigns", async (req, res) => {
    try {
      const fundCampaigns = await storage.getFundCampaignsWithVerification();
      res.json(fundCampaigns);
    } catch (error) {
      console.error("Error fetching fund campaigns:", error);
      res.status(500).json({ error: "Failed to fetch fund campaigns" });
    }
  });

  // ===== ADMIN KYB MANAGEMENT ENDPOINTS =====
  
  // Admin: Get all corporate verifications
  app.get("/api/youhonor/kyb/verifications", authenticateAdmin, async (req, res) => {
    try {
      const status = req.query.status as string;
      const verifications = await storage.getAllCorporateVerifications(status);
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching verifications:", error);
      res.status(500).json({ error: "Failed to fetch verifications" });
    }
  });

  // Admin: Get single corporate verification with documents
  app.get("/api/youhonor/kyb/verification/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const verification = await storage.getCorporateVerificationById(id);
      
      if (!verification) {
        return res.status(404).json({ error: "Verification not found" });
      }
      
      // Get associated documents
      const documents = await storage.getFundDocuments(id);
      
      res.json({ ...verification, documents });
    } catch (error) {
      console.error("Error fetching verification:", error);
      res.status(500).json({ error: "Failed to fetch verification" });
    }
  });

  // Admin: Approve corporate verification
  app.post("/api/youhonor/kyb/verification/:id/approve", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;
      const adminId = 1; // For demo purposes
      
      const verification = await storage.getCorporateVerificationById(id);
      if (!verification) {
        return res.status(404).json({ error: "Verification not found" });
      }
      
      await storage.approveCorporateVerification(id, adminId, notes);
      
      // Log admin action
      await storage.createAdminLog({
        adminId,
        action: 'approve_kyb_verification',
        description: `Approved KYB verification for ${verification.companyName}`,
        tableName: 'corporate_verifications',
        recordId: id.toString(),
      });
      
      console.log(`✅ KYB verification approved: ${id} by admin ${adminId}`);
      res.json({ success: true, message: "Verification approved successfully" });
    } catch (error) {
      console.error("Error approving verification:", error);
      res.status(500).json({ error: "Failed to approve verification" });
    }
  });

  // Admin: Reject corporate verification
  app.post("/api/youhonor/kyb/verification/:id/reject", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      const adminId = 1; // For demo purposes
      
      if (!reason) {
        return res.status(400).json({ error: "Rejection reason is required" });
      }
      
      const verification = await storage.getCorporateVerificationById(id);
      if (!verification) {
        return res.status(404).json({ error: "Verification not found" });
      }
      
      await storage.rejectCorporateVerification(id, adminId, reason);
      
      // Log admin action
      await storage.createAdminLog({
        adminId,
        action: 'reject_kyb_verification',
        description: `Rejected KYB verification for ${verification.companyName}: ${reason}`,
        tableName: 'corporate_verifications',
        recordId: id.toString(),
      });
      
      console.log(`❌ KYB verification rejected: ${id} by admin ${adminId}`);
      res.json({ success: true, message: "Verification rejected successfully" });
    } catch (error) {
      console.error("Error rejecting verification:", error);
      res.status(500).json({ error: "Failed to reject verification" });
    }
  });

  // Admin: Get all pending funds
  app.get("/api/youhonor/kyb/pending-funds", authenticateAdmin, async (req, res) => {
    try {
      const status = req.query.status as string;
      const pendingFunds = status 
        ? await storage.getPendingFundsByStatus(status)
        : await storage.getPendingFundsByStatus('awaiting_review');
      res.json(pendingFunds);
    } catch (error) {
      console.error("Error fetching pending funds:", error);
      res.status(500).json({ error: "Failed to fetch pending funds" });
    }
  });

  // ===== COMPANY BALANCE SYSTEM API ENDPOINTS =====

  // GET /api/company/balance - Get company balance
  app.get("/api/company/balance", authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      const userWallet = req.userWallet;
      if (!userWallet) {
        return res.status(401).json({ error: "Wallet authentication required" });
      }

      const balance = await storage.getCompanyBalance(userWallet);
      
      if (!balance) {
        return res.status(404).json({ error: "Account not found" });
      }

      res.json({ 
        success: true,
        balance: {
          available: balance.available,
          reserved: balance.reserved,
          total: balance.total
        }
      });
    } catch (error) {
      console.error("Error fetching company balance:", error);
      res.status(500).json({ error: "Failed to fetch balance" });
    }
  });

  // POST /api/payment-intents - Create payment intent (KYB collateral payments)
  app.post("/api/payment-intents", async (req: Request, res) => {
    try {
      // Get wallet from request body for KYB collateral payments
      const { wallet } = req.body;
      if (!wallet) {
        return res.status(400).json({ error: "Wallet address required" });
      }

      const { purpose, amount, method, metadata } = req.body;

      if (!purpose || !amount || !method) {
        return res.status(400).json({ error: "Purpose, amount, and method are required" });
      }

      // Validate purpose
      const validPurposes = ['KYB_DEPOSIT', 'BALANCE_TOPUP', 'COLLATERAL_RESERVE'];
      if (!validPurposes.includes(purpose)) {
        return res.status(400).json({ error: "Invalid purpose" });
      }

      // Validate method
      const validMethods = ['USDT', 'STRIPE'];
      if (!validMethods.includes(method)) {
        return res.status(400).json({ error: "Invalid payment method" });
      }

      // Validate amount
      if (parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Amount must be greater than 0" });
      }

      const paymentIntent = await storage.createPaymentIntent({
        wallet: wallet,
        purpose,
        amount,
        method,
        metadata: metadata ? JSON.stringify(metadata) : null,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      });

      res.json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          method: paymentIntent.method,
          purpose: paymentIntent.purpose,
          status: paymentIntent.status,
          expiresAt: paymentIntent.expiresAt
        }
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // POST /api/payment/confirm - Confirm payment
  app.post("/api/payment/confirm", authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      const userWallet = req.userWallet;
      if (!userWallet) {
        return res.status(401).json({ error: "Wallet authentication required" });
      }

      const { paymentIntentId, txHash, stripeData } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment intent ID is required" });
      }

      const paymentIntent = await storage.getPaymentIntent(paymentIntentId);
      
      if (!paymentIntent) {
        return res.status(404).json({ error: "Payment intent not found" });
      }

      if (paymentIntent.wallet !== userWallet) {
        return res.status(403).json({ error: "Unauthorized access to payment intent" });
      }

      if (paymentIntent.status !== 'pending') {
        return res.status(400).json({ error: "Payment intent is not pending" });
      }

      // Check expiry
      if (paymentIntent.expiresAt && new Date() > paymentIntent.expiresAt) {
        return res.status(400).json({ error: "Payment intent has expired" });
      }

      // Validate transaction hash for USDT payments
      if (paymentIntent.method === 'USDT') {
        if (!txHash) {
          return res.status(400).json({ error: "Transaction hash is required for USDT payments" });
        }

        // Check if transaction already used
        const isUsed = await storage.isTransactionUsed(txHash);
        if (isUsed) {
          return res.status(400).json({ error: "Transaction hash already used" });
        }
      }

      // Confirm payment intent
      await storage.confirmPaymentIntent(paymentIntentId, txHash, stripeData);

      // Credit company balance
      await storage.creditBalance(
        userWallet,
        paymentIntent.amount,
        paymentIntent.purpose,
        paymentIntentId,
        "payment_intent"
      );

      // Mark transaction as used for USDT payments
      if (txHash) {
        await storage.createUsedTransaction({
          txHash,
          network: 'ethereum',
          purpose: paymentIntent.purpose,
          wallet: userWallet,
          amount: paymentIntent.amount,
          blockNumber: null
        });
      }

      res.json({
        success: true,
        message: "Payment confirmed and balance credited"
      });
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // POST /api/collateral/reserve - Reserve collateral for campaign
  app.post("/api/collateral/reserve", authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      const userWallet = req.userWallet;
      if (!userWallet) {
        return res.status(401).json({ error: "Wallet authentication required" });
      }

      const { campaignId, amount } = req.body;

      if (!campaignId || !amount) {
        return res.status(400).json({ error: "Campaign ID and amount are required" });
      }

      if (parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Amount must be greater than 0" });
      }

      // Check if campaign exists and belongs to user
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      if (campaign.ownerWallet !== userWallet) {
        return res.status(403).json({ error: "Unauthorized - not campaign owner" });
      }

      // Check if collateral already reserved
      const existingReservation = await storage.getCollateralReservation(campaignId);
      if (existingReservation) {
        return res.status(400).json({ error: "Collateral already reserved for this campaign" });
      }

      // Reserve collateral
      const reservation = await storage.reserveCollateral(campaignId, userWallet, amount);

      res.json({
        success: true,
        reservation: {
          id: reservation.id,
          campaignId: reservation.campaignId,
          amount: reservation.amount,
          status: reservation.status,
          createdAt: reservation.createdAt
        }
      });
    } catch (error) {
      console.error("Error reserving collateral:", error);
      
      if (error.message.includes("Insufficient available balance")) {
        return res.status(400).json({ error: "Insufficient available balance for collateral reservation" });
      }
      
      res.status(500).json({ error: "Failed to reserve collateral" });
    }
  });

  // POST /api/collateral/release - Release collateral for campaign
  app.post("/api/collateral/release", authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      const userWallet = req.userWallet;
      if (!userWallet) {
        return res.status(401).json({ error: "Wallet authentication required" });
      }

      const { campaignId } = req.body;

      if (!campaignId) {
        return res.status(400).json({ error: "Campaign ID is required" });
      }

      // Check if campaign exists and belongs to user
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      if (campaign.ownerWallet !== userWallet) {
        return res.status(403).json({ error: "Unauthorized - not campaign owner" });
      }

      // Release collateral
      await storage.releaseCollateral(campaignId, userWallet);

      res.json({
        success: true,
        message: "Collateral released and returned to available balance"
      });
    } catch (error) {
      console.error("Error releasing collateral:", error);
      res.status(500).json({ error: "Failed to release collateral" });
    }
  });

  // GET /api/balance/history - Get balance transaction history
  app.get("/api/balance/history", authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      const userWallet = req.userWallet;
      if (!userWallet) {
        return res.status(401).json({ error: "Wallet authentication required" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const maxLimit = Math.min(limit, 100); // Cap at 100

      const history = await storage.getBalanceHistory(userWallet, maxLimit);

      res.json({
        success: true,
        history: history.map(entry => ({
          id: entry.id,
          type: entry.type,
          amount: entry.amount,
          reason: entry.reason,
          balanceBefore: entry.balanceBefore,
          balanceAfter: entry.balanceAfter,
          createdAt: entry.createdAt
        }))
      });
    } catch (error) {
      console.error("Error fetching balance history:", error);
      res.status(500).json({ error: "Failed to fetch balance history" });
    }
  });

  // GET /api/collateral/reservations - Get user's collateral reservations
  app.get("/api/collateral/reservations", authenticateUser, async (req: UserAuthenticatedRequest, res) => {
    try {
      const userWallet = req.userWallet;
      if (!userWallet) {
        return res.status(401).json({ error: "Wallet authentication required" });
      }

      const status = req.query.status as string;
      const reservations = await storage.getCollateralReservations(userWallet, undefined, status);

      res.json({
        success: true,
        reservations: reservations.map(reservation => ({
          id: reservation.id,
          campaignId: reservation.campaignId,
          amount: reservation.amount,
          status: reservation.status,
          createdAt: reservation.createdAt,
          releasedAt: reservation.releasedAt
        }))
      });
    } catch (error) {
      console.error("Error fetching collateral reservations:", error);
      res.status(500).json({ error: "Failed to fetch reservations" });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}