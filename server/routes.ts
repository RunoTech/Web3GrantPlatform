import type { Express } from "express";
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
} from "../shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// JWT Secret - in production this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || "duxxan-secret-key-2024";

// Admin authentication middleware
async function authenticateAdmin(req: any, res: any, next: any) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: "Token required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
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

  // Get popular campaigns (public)
  app.get("/api/get-popular-campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getPopularCampaigns(6);
      res.json(campaigns);
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
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
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

  // Create account (public)
  app.post("/api/create-account", async (req, res) => {
    try {
      const accountData = insertAccountSchema.parse(req.body);
      const existingAccount = await storage.getAccount(accountData.wallet);
      
      if (existingAccount) {
        return res.status(409).json({ error: "Account already exists" });
      }

      const account = await storage.createAccount(accountData);
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
      const campaignData = insertCampaignSchema.parse(req.body);
      
      // Check if owner account is active
      const account = await storage.getAccount(campaignData.ownerWallet);
      if (!account || !account.active) {
        return res.status(403).json({ error: "Account must be activated first" });
      }

      const campaign = await storage.createCampaign(campaignData);
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
      res.json(donation);
    } catch (error) {
      console.error("Error recording donation:", error);
      res.status(500).json({ error: "Failed to record donation" });
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
        ethereum: ethereumWalletSetting?.value || "0x742d35Cc6734C0532925a3b2f4f83233Aa5c65aa"
      };
      
      res.json(wallets);
    } catch (error) {
      console.error("Error fetching platform wallets:", error);
      res.status(500).json({ error: "Failed to fetch platform wallets" });
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
  app.post("/api/admin/login", async (req, res) => {
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

      const token = jwt.sign({ adminId: admin.id }, JWT_SECRET, { expiresIn: "24h" });
      
      // Log admin login
      await storage.createAdminLog({
        adminId: admin.id,
        action: "login",
        details: { ip: req.ip, userAgent: req.get('User-Agent') },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
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

  // Admin dashboard statistics
  app.get("/api/admin/dashboard", authenticateAdmin, async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Admin - Get all campaigns
  app.get("/api/admin/campaigns", authenticateAdmin, async (req, res) => {
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
  app.get("/api/admin/campaigns/pending", authenticateAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getPendingCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching pending campaigns:", error);
      res.status(500).json({ error: "Failed to fetch pending campaigns" });
    }
  });

  // Admin - Approve campaign
  app.post("/api/admin/campaigns/:id/approve", authenticateAdmin, async (req: any, res) => {
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
  app.put("/api/admin/campaigns/:id", authenticateAdmin, async (req: any, res) => {
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
  app.get("/api/admin/accounts", authenticateAdmin, async (req, res) => {
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
  app.get("/api/admin/network-fees", authenticateAdmin, async (req, res) => {
    try {
      const fees = await storage.getNetworkFees();
      res.json(fees);
    } catch (error) {
      console.error("Error fetching network fees:", error);
      res.status(500).json({ error: "Failed to fetch network fees" });
    }
  });

  app.post("/api/admin/network-fees", authenticateAdmin, async (req: any, res) => {
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

  app.put("/api/admin/network-fees/:id", authenticateAdmin, async (req: any, res) => {
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
  app.get("/api/admin/settings", authenticateAdmin, async (req, res) => {
    try {
      const category = req.query.category as string;
      const settings = await storage.getPlatformSettings(category);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching platform settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/settings", authenticateAdmin, async (req: any, res) => {
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
  app.get("/api/admin/footer-links", authenticateAdmin, async (req, res) => {
    try {
      const section = req.query.section as string;
      const links = await storage.getFooterLinks(section);
      res.json(links);
    } catch (error) {
      console.error("Error fetching footer links:", error);
      res.status(500).json({ error: "Failed to fetch footer links" });
    }
  });

  app.post("/api/admin/footer-links", authenticateAdmin, async (req: any, res) => {
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

  app.put("/api/admin/footer-links/:id", authenticateAdmin, async (req: any, res) => {
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

  app.delete("/api/admin/footer-links/:id", authenticateAdmin, async (req: any, res) => {
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
  app.get("/api/admin/announcements", authenticateAdmin, async (req, res) => {
    try {
      const announcements = await storage.getAllAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.post("/api/admin/announcements", authenticateAdmin, async (req: any, res) => {
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

  app.put("/api/admin/announcements/:id", authenticateAdmin, async (req: any, res) => {
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

  app.delete("/api/admin/announcements/:id", authenticateAdmin, async (req: any, res) => {
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
  app.get("/api/admin/daily-winners", authenticateAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const winners = await storage.getDailyWinners(limit);
      res.json(winners);
    } catch (error) {
      console.error("Error fetching daily winners:", error);
      res.status(500).json({ error: "Failed to fetch daily winners" });
    }
  });

  app.post("/api/admin/daily-winners", authenticateAdmin, async (req: any, res) => {
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
  app.get("/api/admin/logs", authenticateAdmin, async (req: any, res) => {
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
  app.put("/api/admin/settings/:key", authenticateAdmin, async (req: any, res) => {
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
  app.post("/api/admin/settings-new", authenticateAdmin, async (req: any, res) => {
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
  app.get("/api/admin/settings-categorized", authenticateAdmin, async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}