import type { Express, Request } from "express";
import { createServer, type Server } from "http";
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
  type Admin,
} from "../shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { ethers } from "ethers";

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
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: "Token required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET_VALIDATED) as any;
    const admin = await storage.getAdmin(decoded.adminId);
    
    if (!admin || !admin.active) {
      return res.status(401).json({ error: "Invalid or inactive admin" });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Get all campaigns (public)
  app.get("/api/get-campaigns", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const campaigns = await storage.getCampaigns(limit, offset);
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
    } catch (error) {
      console.error("Error in auto daily entry:", error);
      res.status(500).json({ error: "Failed to participate in daily reward" });
    }
  });

  // Create account (public)
  app.post("/api/create-account", async (req, res) => {
    try {
      const accountData = insertAccountSchema.parse(req.body);
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

  // Activate account with payment verification (public)
  app.post("/api/activate-account", async (req, res) => {
    try {
      const { wallet, txHash, network } = req.body;
      
      if (!wallet || !txHash || !network) {
        return res.status(400).json({ error: "Wallet, transaction hash, and network are required" });
      }

      // Check if account exists
      const account = await storage.getAccount(wallet);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      if (account.active) {
        return res.status(400).json({ error: "Account is already active" });
      }

      // Get network fee and platform wallet
      const networkFees = await storage.getActiveNetworkFees();
      const networkFee = networkFees.find(fee => fee.network === network);
      
      if (!networkFee) {
        return res.status(400).json({ error: "Network fee not found" });
      }

      // Get platform wallet address
      const settings = await storage.getPlatformSettings("payment");
      const platformWalletSetting = settings.find(s => s.key === `${network}_wallet_address`);
      
      if (!platformWalletSetting) {
        return res.status(400).json({ error: "Platform wallet address not configured" });
      }

      // Verify payment using blockchain
      const { verifyPayment } = await import("./blockchain");
      const verification = await verifyPayment(
        network,
        txHash,
        networkFee.amount || "0",
        networkFee.tokenAddress || "",
        platformWalletSetting.value || ""
      );

      if (!verification.success) {
        return res.status(400).json({ error: verification.error || "Payment verification failed" });
      }

      // Activate account
      await storage.updateAccount(wallet, {
        active: true,
        activationTxHash: txHash,
        activationDate: new Date(),
      });

      res.json({ 
        success: true,
        verified: true,
        amount: verification.amount,
        message: "Account activated successfully"
      });
    } catch (error) {
      console.error("Error activating account:", error);
      res.status(500).json({ error: "Failed to activate account" });
    }
  });

  // Get account with affiliate data (public)
  app.get("/api/account/:wallet", async (req, res) => {
    try {
      const { wallet } = req.params;
      const account = await storage.getAccountWithAffiliateData(wallet);
      
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      res.json(account);
    } catch (error) {
      console.error("Error fetching account:", error);
      res.status(500).json({ error: "Failed to fetch account" });
    }
  });

  // Affiliate Application endpoints
  
  // Submit affiliate application
  app.post("/api/affiliate/apply", async (req, res) => {
    try {
      const { wallet, applicationText } = req.body;

      if (!wallet || !applicationText) {
        return res.status(400).json({ 
          success: false, 
          message: "Wallet address and application text are required" 
        });
      }

      // Check if user already has an application
      const existingApplication = await storage.getAffiliateApplication(wallet);
      if (existingApplication) {
        return res.status(400).json({ 
          success: false, 
          message: "You have already submitted an affiliate application" 
        });
      }

      // Create affiliate application
      const application = await storage.createAffiliateApplication({
        wallet,
        applicationText,
        status: "pending"
      });

      res.json({ 
        success: true, 
        message: "Affiliate application submitted successfully",
        application: {
          id: application.id,
          status: application.status,
          appliedAt: application.appliedAt
        }
      });

    } catch (error) {
      console.error("Error creating affiliate application:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to submit application" 
      });
    }
  });

  // Get user's affiliate application status
  app.get("/api/affiliate/application-status/:wallet", async (req, res) => {
    try {
      const { wallet } = req.params;
      const application = await storage.getAffiliateApplication(wallet);
      
      if (!application) {
        return res.json({ 
          success: true, 
          hasApplication: false 
        });
      }

      res.json({ 
        success: true, 
        hasApplication: true,
        application: {
          id: application.id,
          status: application.status,
          appliedAt: application.appliedAt,
          reviewedAt: application.reviewedAt,
          reviewNotes: application.reviewNotes
        }
      });

    } catch (error) {
      console.error("Error fetching affiliate application:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch application status" 
      });
    }
  });

  // Admin: Get all affiliate applications
  app.get("/api/youhonor/affiliate/applications", authenticateAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      const applications = await storage.getAllAffiliateApplications(status as string);
      
      res.json({ 
        success: true, 
        applications 
      });

    } catch (error) {
      console.error("Error fetching affiliate applications:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch applications" 
      });
    }
  });

  // Admin: Update affiliate application status
  app.put("/api/youhonor/affiliate/applications/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reviewNotes } = req.body;
      const adminId = req.admin?.id;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: "Status must be 'approved' or 'rejected'" 
        });
      }

      await storage.updateAffiliateApplicationStatus(
        parseInt(id), 
        status, 
        adminId, 
        reviewNotes
      );

      // If approved, activate affiliate system for the user
      if (status === "approved") {
        // Get application to get wallet address
        const applications = await storage.getAllAffiliateApplications();
        const application = applications.find(app => app.id === parseInt(id));
        
        if (application) {
          await storage.activateAffiliateSystem(application.wallet, 'campaign_creation');
        }
      }

      res.json({ 
        success: true, 
        message: `Application ${status} successfully` 
      });

    } catch (error) {
      console.error("Error updating affiliate application:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update application" 
      });
    }
  });

  // Get affiliate referral stats (public)
  app.get("/api/affiliate/stats/:wallet", async (req, res) => {
    try {
      const { wallet } = req.params;
      const stats = await storage.getReferralStats(wallet);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching affiliate stats:", error);
      res.status(500).json({ error: "Failed to fetch affiliate stats" });
    }
  });

  // Activate affiliate system (public)
  app.post("/api/affiliate/activate", async (req, res) => {
    try {
      const { wallet, activityType, relatedId } = req.body;
      
      if (!wallet || !activityType) {
        return res.status(400).json({ error: "Wallet and activity type are required" });
      }
      
      await storage.activateAffiliateSystem(wallet, activityType, relatedId);
      res.json({ success: true, message: "Affiliate system activated" });
    } catch (error) {
      console.error("Error activating affiliate system:", error);
      res.status(500).json({ error: "Failed to activate affiliate system" });
    }
  });

  // 🎯 NEW: Detailed affiliate analytics (public)
  app.get("/api/affiliate/detailed-stats/:wallet", async (req, res) => {
    try {
      const { wallet } = req.params;
      const detailedStats = await storage.getDetailedAffiliateStats(wallet);
      res.json(detailedStats);
    } catch (error) {
      console.error("Error fetching detailed affiliate stats:", error);
      res.status(500).json({ error: "Failed to fetch detailed affiliate stats" });
    }
  });

  // 🎯 NEW: Unpaid rewards tracking (public)
  app.get("/api/affiliate/unpaid-rewards/:wallet", async (req, res) => {
    try {
      const { wallet } = req.params;
      const unpaidRewards = await storage.getUnpaidRewards(wallet);
      res.json(unpaidRewards);
    } catch (error) {
      console.error("Error fetching unpaid rewards:", error);
      res.status(500).json({ error: "Failed to fetch unpaid rewards" });
    }
  });

  // 🎯 NEW: Affiliate leaderboard (public)
  app.get("/api/affiliate/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getAffiliateLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching affiliate leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch affiliate leaderboard" });
    }
  });

  // Register with referral code (public)
  app.post("/api/register-with-referral", async (req, res) => {
    try {
      const { wallet, referralCode } = req.body;
      
      if (!wallet) {
        return res.status(400).json({ error: "Wallet is required" });
      }

      // Check if account already exists
      const existingAccount = await storage.getAccount(wallet);
      if (existingAccount) {
        return res.status(409).json({ error: "Account already exists" });
      }

      let referredBy = null;
      
      // If referral code provided, validate it
      if (referralCode) {
        const allAccounts = await storage.getAllAccounts();
        const referrer = allAccounts.find(acc => acc.referralCode === referralCode);
        
        if (referrer) {
          referredBy = referrer.wallet;
        } else {
          return res.status(400).json({ error: "Invalid referral code" });
        }
      }

      // Create account with referral info
      const account = await storage.createAccount({
        wallet,
        active: false,
        referredBy,
      });

      res.json(account);
    } catch (error) {
      console.error("Error registering with referral:", error);
      res.status(500).json({ error: "Failed to register with referral" });
    }
  });

  // Direct payment activation (new system - no transaction hash verification needed)
  app.post("/api/direct-activate", async (req, res) => {
    try {
      const { wallet, network, txHash } = req.body;
      
      if (!wallet || !network || !txHash) {
        return res.status(400).json({ error: "Wallet, network, and transaction hash are required" });
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

      // Get network fee for response
      const networkFees = await storage.getActiveNetworkFees();
      const networkFee = networkFees.find(fee => fee.network === network);
      
      if (!networkFee) {
        return res.status(400).json({ error: "Network fee not found" });
      }

      // Activate account immediately (trust frontend MetaMask transaction)
      await storage.updateAccount(wallet, {
        active: true,
        activationTxHash: txHash,
        activationDate: new Date(),
      });

      res.json({ 
        success: true,
        verified: true,
        amount: networkFee.amount,
        tokenSymbol: networkFee.tokenSymbol,
        txHash: txHash,
        message: "Account activated successfully"
      });
    } catch (error) {
      console.error("Error with direct activation:", error);
      res.status(500).json({ error: "Failed to activate account" });
    }
  });

  // Create campaign (public - but requires active account)
  app.post("/api/create-campaign", async (req, res) => {
    try {
      const campaignData = req.body;
      
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
        
        // Get platform wallet address for Ethereum
        const paymentSettings = await storage.getPlatformSettings("payment");
        const platformWalletSetting = paymentSettings.find(s => s.key === "ethereum_wallet_address");
        
        if (!platformWalletSetting?.value) {
          return res.status(500).json({ error: "Platform wallet address not configured" });
        }
        
        // Verify collateral payment on blockchain (instead of trusting client)
        try {
          const { verifyPayment } = await import("./blockchain");
          const verification = await verifyPayment(
            'ethereum',
            campaignData.collateralTxHash,
            requiredCollateral.toString(),
            '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT contract
            platformWalletSetting.value
          );
          
          if (!verification.success) {
            return res.status(400).json({ 
              error: `Collateral payment verification failed. Required: ${requiredCollateral} USDT` 
            });
          }
          
          // Set collateral as paid after successful verification
          campaignData.collateralPaid = true;
          campaignData.collateralAmount = requiredCollateral.toString();
          
        } catch (error) {
          console.error('Collateral verification error:', error);
          return res.status(400).json({ 
            error: `Failed to verify collateral payment. Please ensure you sent ${requiredCollateral} USDT to the platform wallet.` 
          });
        }
      }
      
      // Check if owner account is active (for now skip this requirement)
      // const account = await storage.getAccount(campaignData.ownerWallet);
      // if (!account || !account.active) {
      //   return res.status(403).json({ error: "Account must be activated first" });
      // }

      const campaign = await storage.createCampaign(campaignData);
      
      // Activate affiliate system for campaign creator (if first donation/campaign)
      try {
        await storage.activateAffiliateSystem(campaignData.ownerWallet, 'campaign_creation', campaign.id);
      } catch (error) {
        console.error("Error activating affiliate system for campaign:", error);
        // Don't fail the campaign creation if affiliate activation fails
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  // Join daily reward (free for everyone, once per day)
  app.post("/api/join-daily-reward", async (req, res) => {
    try {
      const { wallet } = req.body;
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
    } catch (error) {
      console.error("Error creating daily entry:", error);
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
  app.post("/api/record-donation", async (req, res) => {
    try {
      const donationData = insertDonationSchema.parse(req.body);
      const donation = await storage.createDonation(donationData);
      
      // Activate affiliate system for donor (if first donation/campaign)
      try {
        await storage.activateAffiliateSystem(donationData.donorWallet, 'donation', donation.id);
      } catch (error) {
        console.error("Error activating affiliate system for donation:", error);
        // Don't fail the donation if affiliate activation fails
      }
      
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

  // Get payment attempts for a campaign (public) - for campaign owners
  app.get("/api/campaign/:id/payment-attempts", async (req: Request, res: any) => {
    try {
      const campaignId = parseInt(req.params.id);
      if (isNaN(campaignId)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
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

  // Get payment attempts for a wallet (public) - for users
  app.get("/api/wallet/:wallet/payment-attempts", async (req: Request, res: any) => {
    try {
      const wallet = req.params.wallet;
      if (!wallet || wallet.length !== 42 || !wallet.startsWith('0x')) {
        return res.status(400).json({ error: "Invalid wallet address" });
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
  app.get("/api/youhonor/daily-entries/:date", async (req, res) => {
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
  app.get("/api/youhonor/daily-winner/:date", async (req, res) => {
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
  app.get("/api/youhonor/daily-stats", async (req, res) => {
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
  app.post("/api/youhonor/select-random-winner", async (req, res) => {
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
  app.post("/api/youhonor/select-manual-winner", async (req, res) => {
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
        token,
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

  // Affiliates Management
  app.get("/api/youhonor/affiliates", authenticateAdmin, async (req, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const filters = { status };
      const affiliates = await storage.getAffiliateApplications(filters, parseInt(page as string), parseInt(limit as string));
      res.json(affiliates);
    } catch (error) {
      console.error("Error fetching affiliate applications:", error);
      res.status(500).json({ error: "Failed to fetch affiliate applications" });
    }
  });

  app.post("/api/youhonor/affiliates/:id/approve", authenticateAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;
      await storage.approveAffiliateApplication(parseInt(id), req.admin.id, reviewNotes);
      
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "approve_affiliate",
        details: `Approved affiliate application ID ${id}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error approving affiliate application:", error);
      res.status(500).json({ error: "Failed to approve affiliate application" });
    }
  });

  app.post("/api/youhonor/affiliates/:id/reject", authenticateAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;
      await storage.rejectAffiliateApplication(parseInt(id), req.admin.id, reviewNotes);
      
      await storage.createAdminLog({
        adminId: req.admin.id,
        action: "reject_affiliate",
        details: `Rejected affiliate application ID ${id}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting affiliate application:", error);
      res.status(500).json({ error: "Failed to reject affiliate application" });
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


  const httpServer = createServer(app);
  return httpServer;
}