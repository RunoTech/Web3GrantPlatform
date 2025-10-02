import { db } from "./db";
import { and, or, eq, ilike, gte, lte, asc, desc, sql, gt } from "drizzle-orm";
import {
  type Admin, type InsertAdmin,
  type PlatformSetting, type InsertPlatformSetting,
  type NetworkFee, type InsertNetworkFee,
  type Account, type InsertAccount,
  type Campaign, type InsertCampaign,
  type Donation, type InsertDonation,
  type DailyEntry, type InsertDailyEntry,
  type DailyWinner, type InsertDailyWinner,
  type FooterLink, type InsertFooterLink,
  type Announcement, type InsertAnnouncement,
  type AdminLog, type InsertAdminLog,
  type Wallet, type InsertWallet,
  type Transaction, type InsertTransaction,
  type DailyReward, type InsertDailyReward,
  type DailyParticipant, type InsertDailyParticipant,
  type PaymentAttempt, type InsertPaymentAttempt,
  type UserNonce, type InsertUserNonce,
  type UserSession, type InsertUserSession,
  type UsedTransaction, type InsertUsedTransaction,
  type PendingPayment, type InsertPendingPayment,
  type CorporateVerification, type InsertCorporateVerification,
  type FundDocument, type InsertFundDocument,
  type PendingFund, type InsertPendingFund,
  type CollateralReservation, type InsertCollateralReservation,
  type PaymentIntent, type InsertPaymentIntent,
  type BalanceLedger, type InsertBalanceLedger,
  admins,
  platformSettings,
  networkFees,
  accounts,
  campaigns,
  donations,
  dailyEntries,
  dailyWinners,
  footerLinks,
  announcements,
  adminLogs,
  wallets,
  transactions,
  dailyRewards,
  dailyParticipants,
  paymentAttempts,
  userNonces,
  userSessions,
  usedTransactions,
  pendingPayments,
  corporateVerifications,
  fundDocuments,
  pendingFunds,
  collateralReservations,
  paymentIntents,
  balanceLedger,
} from "../shared/schema";

export interface IStorage {
  // Admin Management
  getAdmin(id: number): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdmin(id: number, updates: Partial<Admin>): Promise<void>;
  getAllAdmins(): Promise<Admin[]>;

  // User Authentication (SIWE)
  createUserNonce(nonce: InsertUserNonce): Promise<UserNonce>;
  getUserNonce(nonce: string): Promise<UserNonce | undefined>;
  markNonceAsUsed(id: number): Promise<void>;
  cleanupExpiredNonces(): Promise<void>;
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  getUserSession(sessionId: string): Promise<UserSession | undefined>;
  getUserSessionsByWallet(wallet: string): Promise<UserSession[]>;
  updateSessionLastUsed(sessionId: string): Promise<void>;
  invalidateUserSession(sessionId: string): Promise<void>;
  invalidateAllUserSessions(wallet: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;

  // Transaction Idempotency (Security)
  createUsedTransaction(transaction: InsertUsedTransaction): Promise<UsedTransaction>;
  isTransactionUsed(txHash: string): Promise<boolean>;
  getUsedTransaction(txHash: string): Promise<UsedTransaction | undefined>;

  // Pending Payments (Auto Campaign Creation)
  addPendingPayment(payment: InsertPendingPayment): Promise<PendingPayment>;
  getPendingPayments(status?: string): Promise<PendingPayment[]>;
  updatePendingPayment(id: number, updates: Partial<PendingPayment>): Promise<void>;
  getPendingByTxHash(txHash: string): Promise<PendingPayment | undefined>;
  markPendingConfirmed(id: number): Promise<void>;
  findDuplicatesByTxHash(txHash: string): Promise<PendingPayment[]>;
  findByOwnerAmountRecent(ownerWallet: string, amount: string, hours: number): Promise<PendingPayment[]>;

  // Platform Settings
  getPlatformSettings(category?: string): Promise<PlatformSetting[]>;
  getPlatformSetting(key: string): Promise<PlatformSetting | undefined>;
  setPlatformSetting(setting: InsertPlatformSetting): Promise<PlatformSetting>;
  updatePlatformSetting(key: string, value: string, updatedBy: number): Promise<void>;

  // Network Fees
  getNetworkFees(): Promise<NetworkFee[]>;
  getActiveNetworkFees(): Promise<NetworkFee[]>;
  getNetworkFee(network: string): Promise<NetworkFee | undefined>;
  createNetworkFee(fee: InsertNetworkFee): Promise<NetworkFee>;
  updateNetworkFee(id: number, updates: Partial<NetworkFee>): Promise<void>;

  // Accounts
  getAccount(wallet: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(wallet: string, updates: Partial<Account>): Promise<void>;
  getAllAccounts(limit?: number, offset?: number): Promise<Account[]>;
  getActiveAccountsCount(): Promise<number>;
  recordUserLogin(wallet: string): Promise<void>;
  canParticipateDaily(wallet: string, date: string): Promise<boolean>;

  // Campaigns
  getCampaigns(
    limit?: number, 
    offset?: number,
    filters?: {
      search?: string;
      campaignType?: 'FUND' | 'DONATE';
      creatorType?: 'company' | 'citizen' | 'association' | 'foundation';
      status?: 'active' | 'featured' | 'approved';
      minAmount?: number;
      maxAmount?: number;
      sortBy?: 'newest' | 'oldest' | 'most_funded' | 'ending_soon';
      creditCardEnabled?: boolean;
    }
  ): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  getCampaignByTxHash(txHash: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, updates: Partial<Campaign>): Promise<void>;
  getPopularCampaigns(limit: number): Promise<Campaign[]>;
  getPendingCampaigns(): Promise<Campaign[]>;
  approveCampaign(id: number, adminId: number): Promise<void>;

  // Donations
  createDonation(donation: InsertDonation): Promise<Donation>;
  getDonationsByCampaign(campaignId: number): Promise<Donation[]>;
  getDonationsByWallet(wallet: string): Promise<Donation[]>;
  getTotalDonations(): Promise<{ total: string; count: number }>;

  // Daily Rewards
  createDailyEntry(entry: InsertDailyEntry): Promise<DailyEntry>;
  getDailyEntries(date: string): Promise<DailyEntry[]>;
  getDailyEntriesByDate(date: string): Promise<DailyEntry[]>;
  checkDailyEntry(wallet: string, date: string): Promise<boolean>;
  getTodayStats(date: string): Promise<{ participants: number; date: string }>;
  getDailyRewardStats(): Promise<{ totalEntries: number; totalWinners: number; totalRewards: number; activeDays: number }>;
  
  // Daily Winners
  createDailyWinner(winner: InsertDailyWinner): Promise<DailyWinner>;
  getDailyWinnerByDate(date: string): Promise<DailyWinner | undefined>;
  getDailyWinners(limit?: number): Promise<DailyWinner[]>;
  getDailyWinnersByDate(date: string): Promise<DailyWinner[]>;

  // Footer Links
  getFooterLinks(section?: string): Promise<FooterLink[]>;
  createFooterLink(link: InsertFooterLink): Promise<FooterLink>;
  updateFooterLink(id: number, updates: Partial<FooterLink>): Promise<void>;
  deleteFooterLink(id: number): Promise<void>;

  // Announcements
  getActiveAnnouncements(): Promise<Announcement[]>;
  getAllAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<void>;
  deleteAnnouncement(id: number): Promise<void>;

  // Admin Logs
  createAdminLog(log: InsertAdminLog): Promise<AdminLog>;

  // Statistics for Admin Dashboard
  getStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalCampaigns: number;
    pendingCampaigns: number;
    totalDonations: string;
    totalDonationCount: number;
    todayEntries: number;
  }>;
  
  // Database Administration
  getTableData(tableName: string, options: { page: number; limit: number; search: string }): Promise<any[]>;
  getTableStats(tableName: string): Promise<{ total: number }>;
  createRecord(tableName: string, data: any): Promise<any>;
  updateRecord(tableName: string, id: string, data: any): Promise<any>;
  deleteRecord(tableName: string, id: string): Promise<void>;
  exportTableData(tableName: string): Promise<any[]>;


  // ===== NEW ADMIN ENDPOINTS METHODS =====
  
  // Transactions Management
  getTransactions(filters: any, page: number, limit: number): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  
  // Wallets Management
  getWallets(filters: any, page: number, limit: number): Promise<Wallet[]>;
  getBalancesSummary(scope: string, id: string): Promise<any>;
  
  // Enhanced Daily Rewards Management
  getDailyRewards(page: number, limit: number): Promise<DailyReward[]>;
  updateDailyRewardAmount(id: number, amount: string): Promise<void>;
  getDailyRewardParticipants(dailyRewardId: number): Promise<DailyParticipant[]>;
  setDailyRewardWinner(dailyRewardId: number, wallet: string, selectedBy: number): Promise<void>;
  closeDailyReward(id: number): Promise<void>;
  openDailyReward(id: number): Promise<void>;
  
  // User Analytics Dashboard
  getUserDonationHistory(wallet: string, filters?: any): Promise<any[]>;
  getUserDonationStats(wallet: string): Promise<any>;
  getCampaignAnalytics(campaignId: number): Promise<any>;
  getUserCampaignAnalytics(wallet: string): Promise<any>;
  getUserTimeAnalytics(wallet: string, timeRange: string): Promise<any>;
  
  // Enhanced Campaigns Management
  getAdminCampaigns(filters: any, page: number, limit: number): Promise<Campaign[]>;
  rejectCampaign(id: number, adminId: number): Promise<void>;
  toggleCampaignCompanyVisibility(id: number): Promise<void>;
  
  
  // Enhanced Admin Logs
  getAdminLogs(filters: any, page: number, limit: number): Promise<AdminLog[]>;

  // Payment Attempts (for tracking failed payments)
  createPaymentAttempt(attempt: InsertPaymentAttempt): Promise<PaymentAttempt>;
  getPaymentAttemptsByWallet(wallet: string): Promise<PaymentAttempt[]>;
  getPaymentAttemptsByCampaign(campaignId: number): Promise<PaymentAttempt[]>;

  // ===== FUND KYB & VERIFICATION METHODS =====
  
  // Corporate Verification Management
  createCorporateVerification(verification: InsertCorporateVerification): Promise<CorporateVerification>;
  getCorporateVerification(wallet: string): Promise<CorporateVerification | undefined>;
  getCorporateVerificationById(id: number): Promise<CorporateVerification | undefined>;
  updateCorporateVerification(id: number, updates: Partial<CorporateVerification>): Promise<void>;
  deleteCorporateVerification(id: number): Promise<void>;
  getAllCorporateVerifications(status?: string): Promise<CorporateVerification[]>;
  approveCorporateVerification(id: number, adminId: number, notes?: string): Promise<void>;
  rejectCorporateVerification(id: number, adminId: number, reason: string): Promise<void>;
  
  // Document Management
  uploadFundDocument(document: InsertFundDocument): Promise<FundDocument>;
  getFundDocuments(verificationId: number): Promise<FundDocument[]>;
  getFundDocument(id: number): Promise<FundDocument | undefined>;
  deleteFundDocument(id: number): Promise<void>;
  
  // Pending Funds Management
  createPendingFund(fund: InsertPendingFund): Promise<PendingFund>;
  getPendingFund(id: number): Promise<PendingFund | undefined>;
  getPendingFundsByWallet(wallet: string): Promise<PendingFund[]>;
  getPendingFundsByStatus(status: string): Promise<PendingFund[]>;
  updatePendingFund(id: number, updates: Partial<PendingFund>): Promise<void>;
  markPendingFundAsPublished(id: number, campaignId: number): Promise<void>;
  
  // ===== COMPANY BALANCE SYSTEM METHODS =====
  
  // Company Balance Operations
  getCompanyBalance(wallet: string): Promise<{ available: string; reserved: string; total: string } | undefined>;
  creditBalance(wallet: string, amount: string, reason: string, refId?: number, refType?: string): Promise<void>;
  debitBalance(wallet: string, amount: string, reason: string, refId?: number, refType?: string): Promise<void>;
  updateBalanceFields(wallet: string, availableDelta: string, reservedDelta: string): Promise<void>;
  
  // Collateral Reservation Operations
  reserveCollateral(campaignId: number, wallet: string, amount: string): Promise<CollateralReservation>;
  releaseCollateral(campaignId: number, wallet?: string): Promise<void>;
  getCollateralReservations(wallet?: string, campaignId?: number, status?: string): Promise<CollateralReservation[]>;
  getCollateralReservation(campaignId: number): Promise<CollateralReservation | undefined>;
  
  // Payment Intent Operations  
  createPaymentIntent(intent: InsertPaymentIntent): Promise<PaymentIntent>;
  getPaymentIntent(id: number): Promise<PaymentIntent | undefined>;
  getPaymentIntentByTxHash(txHash: string): Promise<PaymentIntent | undefined>;
  updatePaymentIntent(id: number, updates: Partial<PaymentIntent>): Promise<void>;
  confirmPaymentIntent(id: number, txHash?: string, stripeData?: any): Promise<void>;
  getPaymentIntentsByWallet(wallet: string, status?: string): Promise<PaymentIntent[]>;
  
  // Balance Ledger Operations
  recordBalanceTransaction(entry: InsertBalanceLedger): Promise<BalanceLedger>;
  getBalanceHistory(wallet: string, limit?: number): Promise<BalanceLedger[]>;
  getBalanceTransactionsByReason(wallet: string, reason: string): Promise<BalanceLedger[]>;
}

export class DatabaseStorage implements IStorage {
  // Admin Management
  async getAdmin(id: number): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin || undefined;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    return admin || undefined;
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin || undefined;
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [newAdmin] = await db
      .insert(admins)
      .values(admin)
      .returning();
    return newAdmin;
  }

  async updateAdmin(id: number, updates: Partial<Admin>): Promise<void> {
    await db
      .update(admins)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(admins.id, id));
  }

  async getAllAdmins(): Promise<Admin[]> {
    return await db.select().from(admins).orderBy(desc(admins.createdAt));
  }

  // Platform Settings
  async getPlatformSettings(category?: string): Promise<PlatformSetting[]> {
    if (category) {
      return await db.select().from(platformSettings).where(eq(platformSettings.category, category));
    }
    return await db.select().from(platformSettings);
  }

  async getPlatformSetting(key: string): Promise<PlatformSetting | undefined> {
    const [setting] = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
    return setting || undefined;
  }

  async setPlatformSetting(setting: InsertPlatformSetting): Promise<PlatformSetting> {
    const [newSetting] = await db
      .insert(platformSettings)
      .values(setting)
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: {
          value: setting.value,
          description: setting.description,
          updatedAt: new Date(),
          updatedBy: setting.updatedBy,
        },
      })
      .returning();
    return newSetting;
  }

  async updatePlatformSetting(key: string, value: string, updatedBy: number): Promise<void> {
    await db
      .update(platformSettings)
      .set({ value, updatedAt: new Date(), updatedBy })
      .where(eq(platformSettings.key, key));
  }

  async getSettingsMap(): Promise<Record<string, string>> {
    const settings = await db.select().from(platformSettings);
    const settingsMap: Record<string, string> = {};
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }
    return settingsMap;
  }

  // Network Fees
  async getNetworkFees(): Promise<NetworkFee[]> {
    return await db.select().from(networkFees).orderBy(networkFees.network);
  }

  async getActiveNetworkFees(): Promise<NetworkFee[]> {
    return await db.select().from(networkFees).where(eq(networkFees.active, true));
  }

  async getNetworkFee(network: string): Promise<NetworkFee | undefined> {
    const [fee] = await db.select().from(networkFees)
      .where(and(eq(networkFees.network, network), eq(networkFees.active, true)));
    return fee || undefined;
  }

  async createNetworkFee(fee: InsertNetworkFee): Promise<NetworkFee> {
    const [newFee] = await db.insert(networkFees).values(fee).returning();
    return newFee;
  }

  async updateNetworkFee(id: number, updates: Partial<NetworkFee>): Promise<void> {
    await db
      .update(networkFees)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(networkFees.id, id));
  }

  // Accounts
  async getAccount(wallet: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.wallet, wallet));
    return account || undefined;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(wallet: string, updates: Partial<Account>): Promise<void> {
    await db
      .update(accounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(accounts.wallet, wallet));
  }

  async getAllAccounts(limit: number = 100, offset: number = 0): Promise<Account[]> {
    return await db.select().from(accounts)
      .orderBy(desc(accounts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getActiveAccountsCount(): Promise<number> {
    const [result] = await db.select({ count: sql`count(*)` })
      .from(accounts)
      .where(eq(accounts.active, true));
    return Number(result.count);
  }

  async recordUserLogin(wallet: string): Promise<void> {
    const account = await this.getAccount(wallet);
    if (!account) {
      // Create account if doesn't exist
      await this.createAccount({ wallet });
    }
    
    // Update login info
    await db
      .update(accounts)
      .set({ 
        lastLoginAt: new Date(),
        totalLogins: sql`${accounts.totalLogins} + 1`,
        updatedAt: new Date()
      })
      .where(eq(accounts.wallet, wallet));
  }

  async canParticipateDaily(wallet: string, date: string): Promise<boolean> {
    const account = await this.getAccount(wallet);
    if (!account || !account.active) return false;
    
    // Check if already participated today by looking at actual daily entries
    const existingEntry = await db.select().from(dailyEntries)
      .where(and(eq(dailyEntries.wallet, wallet), eq(dailyEntries.date, date)))
      .limit(1);
    
    return existingEntry.length === 0;
  }

  // Campaigns with advanced filtering
  async getCampaigns(
    limit: number = 50, 
    offset: number = 0,
    filters?: {
      search?: string;
      campaignType?: 'FUND' | 'DONATE';
      creatorType?: 'company' | 'citizen' | 'association' | 'foundation';
      status?: 'active' | 'featured' | 'approved';
      minAmount?: number;
      maxAmount?: number;
      sortBy?: 'newest' | 'oldest' | 'most_funded' | 'ending_soon';
      creditCardEnabled?: boolean;
    }
  ): Promise<Campaign[]> {
    let query = db.select().from(campaigns);
    
    // Apply filters
    const conditions = [];
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(campaigns.title, `%${filters.search}%`),
          ilike(campaigns.description, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.campaignType) {
      conditions.push(eq(campaigns.campaignType, filters.campaignType));
    }
    
    if (filters?.creatorType) {
      conditions.push(eq(campaigns.creatorType, filters.creatorType));
    }
    
    if (filters?.status === 'active') {
      conditions.push(eq(campaigns.active, true));
    }
    
    if (filters?.status === 'featured') {
      conditions.push(eq(campaigns.featured, true));
    }
    
    if (filters?.status === 'approved') {
      conditions.push(eq(campaigns.approved, true));
    }
    
    if (filters?.minAmount) {
      conditions.push(gte(campaigns.targetAmount, filters.minAmount.toString()));
    }
    
    if (filters?.maxAmount) {
      conditions.push(lte(campaigns.targetAmount, filters.maxAmount.toString()));
    }
    
    if (filters?.creditCardEnabled !== undefined) {
      conditions.push(eq(campaigns.creditCardEnabled, filters.creditCardEnabled));
    }
    
    // Apply where conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Apply sorting
    switch (filters?.sortBy) {
      case 'oldest':
        query = query.orderBy(asc(campaigns.createdAt));
        break;
      case 'most_funded':
        query = query.orderBy(desc(campaigns.totalDonations));
        break;
      case 'ending_soon':
        query = query.orderBy(asc(campaigns.endDate));
        break;
      case 'newest':
      default:
        query = query.orderBy(desc(campaigns.createdAt));
        break;
    }
    
    return await query.limit(limit).offset(offset);
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async getCampaignByTxHash(txHash: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.collateralTxHash, txHash));
    return campaign || undefined;
  }

  async createCampaign(campaign: any): Promise<Campaign> {
    console.log("Raw campaign data:", JSON.stringify(campaign, null, 2));
    
    // Clean conversion without spreading that causes overwrite
    const campaignData: any = {
      // Copy basic fields, skip empty strings
      title: campaign.title,
      description: campaign.description,
      imageUrl: campaign.imageUrl || "",
      ownerWallet: campaign.ownerWallet,
      campaignType: campaign.campaignType,
      creatorType: campaign.creatorType,
      targetAmount: campaign.targetAmount,
      creditCardEnabled: campaign.creditCardEnabled || false,
      collateralAmount: campaign.collateralAmount,
      collateralTxHash: campaign.collateralTxHash,
      collateralPaid: campaign.collateralPaid || false,
      
      // Integer fields with defaults
      donationCount: 0,
      
      // Date conversion
      startDate: campaign.startDate && campaign.startDate !== "" ? new Date(campaign.startDate + "T00:00:00.000Z") : null,
      endDate: campaign.endDate && campaign.endDate !== "" ? new Date(campaign.endDate + "T23:59:59.999Z") : null,
    };
    
    // Add optional company fields only if not empty
    if (campaign.companyName && campaign.companyName !== "") campaignData.companyName = campaign.companyName;
    if (campaign.companyRegistrationNumber && campaign.companyRegistrationNumber !== "") campaignData.companyRegistrationNumber = campaign.companyRegistrationNumber;
    if (campaign.companyAddress && campaign.companyAddress !== "") campaignData.companyAddress = campaign.companyAddress;
    if (campaign.companyWebsite && campaign.companyWebsite !== "") campaignData.companyWebsite = campaign.companyWebsite;
    if (campaign.companyEmail && campaign.companyEmail !== "") campaignData.companyEmail = campaign.companyEmail;
    if (campaign.companyPhone && campaign.companyPhone !== "") campaignData.companyPhone = campaign.companyPhone;
    if (campaign.companyCEO && campaign.companyCEO !== "") campaignData.companyCEO = campaign.companyCEO;
    if (campaign.companyIndustry && campaign.companyIndustry !== "") campaignData.companyIndustry = campaign.companyIndustry;
    if (campaign.companyEmployeeCount && campaign.companyEmployeeCount !== "") campaignData.companyEmployeeCount = campaign.companyEmployeeCount;
    if (campaign.companyFoundedYear && campaign.companyFoundedYear !== "") {
      campaignData.companyFoundedYear = parseInt(campaign.companyFoundedYear);
    }
    
    console.log("Cleaned campaign data:", JSON.stringify(campaignData, null, 2));
    
    const [newCampaign] = await db.insert(campaigns).values(campaignData).returning();
    return newCampaign;
  }

  async updateCampaign(id: number, updates: Partial<Campaign>): Promise<void> {
    await db
      .update(campaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(campaigns.id, id));
  }

  async getPopularCampaigns(limit: number): Promise<Campaign[]> {
    return await db.select().from(campaigns)
      .where(and(eq(campaigns.active, true), eq(campaigns.approved, true)))
      .orderBy(desc(campaigns.totalDonations), desc(campaigns.donationCount))
      .limit(limit);
  }

  async getPendingCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns)
      .where(eq(campaigns.approved, false))
      .orderBy(desc(campaigns.createdAt));
  }

  async approveCampaign(id: number, adminId: number): Promise<void> {
    await db
      .update(campaigns)
      .set({
        approved: true,
        approvedBy: adminId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, id));
  }

  // Donations
  async createDonation(donation: InsertDonation): Promise<Donation> {
    const [newDonation] = await db.insert(donations).values(donation).returning();
    
    // Update campaign totals
    await db
      .update(campaigns)
      .set({
        totalDonations: sql`${campaigns.totalDonations} + ${donation.amount}`,
        donationCount: sql`${campaigns.donationCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, donation.campaignId));
    
    return newDonation;
  }

  async getDonationsByCampaign(campaignId: number): Promise<Donation[]> {
    return await db.select().from(donations)
      .where(eq(donations.campaignId, campaignId))
      .orderBy(desc(donations.createdAt));
  }

  async getDonationsByWallet(wallet: string): Promise<Donation[]> {
    return await db.select().from(donations)
      .where(eq(donations.donorWallet, wallet))
      .orderBy(desc(donations.createdAt));
  }

  async getTotalDonations(): Promise<{ total: string; count: number }> {
    const [result] = await db.select({
      total: sql`COALESCE(SUM(${donations.amount}), 0)`,
      count: sql`COUNT(*)`
    }).from(donations);
    
    return {
      total: result.total?.toString() || "0",
      count: Number(result.count)
    };
  }

  // Daily Rewards
  async createDailyEntry(entry: InsertDailyEntry): Promise<DailyEntry> {
    try {
      const [newEntry] = await db.insert(dailyEntries).values(entry).returning();
      return newEntry;
    } catch (error: any) {
      // Handle unique constraint violation (duplicate wallet + date)
      if (error.code === '23505' || error.message?.includes('unique_wallet_date')) {
        throw new Error('ALREADY_PARTICIPATED');
      }
      throw error;
    }
  }

  async getDailyEntries(date: string): Promise<DailyEntry[]> {
    return await db.select().from(dailyEntries).where(eq(dailyEntries.date, date));
  }

  async checkDailyEntry(wallet: string, date: string): Promise<boolean> {
    const [entry] = await db.select().from(dailyEntries)
      .where(and(eq(dailyEntries.wallet, wallet), eq(dailyEntries.date, date)));
    return !!entry;
  }

  async createDailyWinner(winner: InsertDailyWinner): Promise<DailyWinner> {
    const [newWinner] = await db.insert(dailyWinners).values(winner).returning();
    return newWinner;
  }

  async getDailyWinners(limit: number = 10): Promise<DailyWinner[]> {
    return await db.select().from(dailyWinners)
      .orderBy(desc(dailyWinners.date))
      .limit(limit);
  }

  async getDailyWinnersByDate(date: string): Promise<DailyWinner[]> {
    return await db.select().from(dailyWinners).where(eq(dailyWinners.date, date));
  }

  async getDailyEntriesByDate(date: string): Promise<DailyEntry[]> {
    return await db.select().from(dailyEntries).where(eq(dailyEntries.date, date));
  }

  async getDailyWinnerByDate(date: string): Promise<DailyWinner | undefined> {
    const [winner] = await db.select().from(dailyWinners).where(eq(dailyWinners.date, date));
    return winner || undefined;
  }

  async getTodayStats(date: string): Promise<{ participants: number; date: string }> {
    const [stats] = await db.select({
      participants: sql`COUNT(*)`
    }).from(dailyEntries).where(eq(dailyEntries.date, date));
    
    return {
      participants: Number(stats.participants) || 0,
      date
    };
  }

  async getDailyRewardStats(): Promise<{ totalEntries: number; totalWinners: number; totalRewards: number; activeDays: number }> {
    const [entryStats] = await db.select({
      totalEntries: sql`COUNT(*)`
    }).from(dailyEntries);

    const [winnerStats] = await db.select({
      totalWinners: sql`COUNT(*)`,
      totalRewards: sql`COALESCE(SUM(${dailyWinners.amount}), 0)`
    }).from(dailyWinners);

    const [dayStats] = await db.select({
      activeDays: sql`COUNT(DISTINCT ${dailyEntries.date})`
    }).from(dailyEntries);

    return {
      totalEntries: Number(entryStats.totalEntries) || 0,
      totalWinners: Number(winnerStats.totalWinners) || 0,
      totalRewards: Number(winnerStats.totalRewards) || 0,
      activeDays: Number(dayStats.activeDays) || 0
    };
  }

  // Footer Links
  async getFooterLinks(section?: string): Promise<FooterLink[]> {
    if (section) {
      return await db.select().from(footerLinks)
        .where(and(eq(footerLinks.section, section), eq(footerLinks.active, true)))
        .orderBy(footerLinks.order);
    }
    return await db.select().from(footerLinks)
      .where(eq(footerLinks.active, true))
      .orderBy(footerLinks.section, footerLinks.order);
  }

  async createFooterLink(link: InsertFooterLink): Promise<FooterLink> {
    const [newLink] = await db.insert(footerLinks).values(link).returning();
    return newLink;
  }

  async updateFooterLink(id: number, updates: Partial<FooterLink>): Promise<void> {
    await db
      .update(footerLinks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(footerLinks.id, id));
  }

  async deleteFooterLink(id: number): Promise<void> {
    await db.delete(footerLinks).where(eq(footerLinks.id, id));
  }

  // Announcements
  async getActiveAnnouncements(): Promise<Announcement[]> {
    const now = new Date();
    return await db.select().from(announcements)
      .where(and(
        eq(announcements.active, true),
        sql`${announcements.showUntil} IS NULL OR ${announcements.showUntil} > ${now}`
      ))
      .orderBy(desc(announcements.createdAt));
  }

  async getAllAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements)
      .orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  async updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<void> {
    await db
      .update(announcements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(announcements.id, id));
  }

  async deleteAnnouncement(id: number): Promise<void> {
    await db.delete(announcements).where(eq(announcements.id, id));
  }

  // Admin Logs
  async createAdminLog(log: InsertAdminLog): Promise<AdminLog> {
    const [newLog] = await db.insert(adminLogs).values(log).returning();
    return newLog;
  }


  // Statistics
  async getStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalCampaigns: number;
    pendingCampaigns: number;
    totalDonations: string;
    totalDonationCount: number;
    todayEntries: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    const [userStats] = await db.select({
      total: sql`COUNT(*)`,
      active: sql`COUNT(CASE WHEN ${accounts.active} THEN 1 END)`
    }).from(accounts);

    const [campaignStats] = await db.select({
      total: sql`COUNT(*)`,
      pending: sql`COUNT(CASE WHEN NOT ${campaigns.approved} THEN 1 END)`
    }).from(campaigns);

    const [donationStats] = await db.select({
      total: sql`COALESCE(SUM(${donations.amount}), 0)`,
      count: sql`COUNT(*)`
    }).from(donations);

    const [todayStats] = await db.select({
      entries: sql`COUNT(*)`
    }).from(dailyEntries).where(eq(dailyEntries.date, today));

    return {
      totalUsers: Number(userStats.total),
      activeUsers: Number(userStats.active),
      totalCampaigns: Number(campaignStats.total),
      pendingCampaigns: Number(campaignStats.pending),
      totalDonations: donationStats.total?.toString() || "0",
      totalDonationCount: Number(donationStats.count),
      todayEntries: Number(todayStats.entries),
    };
  }

  // Database Administration
  async getTableData(tableName: string, options: { page: number; limit: number; search: string }): Promise<any[]> {
    const offset = (options.page - 1) * options.limit;
    
    const tableMap: Record<string, any> = {
      accounts, campaigns, donations, dailyEntries, dailyWinners,
      admins, platformSettings, networkFees, footerLinks, announcements, adminLogs
    };
    
    const table = tableMap[tableName];
    if (!table) throw new Error(`Table ${tableName} not found`);

    return await db.select().from(table).limit(options.limit).offset(offset);
  }

  async getTableStats(tableName: string): Promise<{ total: number }> {
    const tableMap: Record<string, any> = {
      accounts, campaigns, donations, dailyEntries, dailyWinners,
      admins, platformSettings, networkFees, footerLinks, announcements, adminLogs
    };
    
    const table = tableMap[tableName];
    if (!table) throw new Error(`Table ${tableName} not found`);

    const [result] = await db.select({ count: sql<number>`count(*)` }).from(table);
    return { total: result.count };
  }

  async createRecord(tableName: string, data: any): Promise<any> {
    const tableMap: Record<string, any> = {
      accounts, campaigns, donations, dailyEntries, dailyWinners,
      admins, platformSettings, networkFees, footerLinks, announcements, adminLogs
    };
    
    const table = tableMap[tableName];
    if (!table) throw new Error(`Table ${tableName} not found`);

    const result = await db.insert(table).values(data).returning();
    return result[0];
  }

  async updateRecord(tableName: string, id: string, data: any): Promise<any> {
    const tableMap: Record<string, any> = {
      accounts, campaigns, donations, dailyEntries, dailyWinners,
      admins, platformSettings, networkFees, footerLinks, announcements, adminLogs
    };
    
    const table = tableMap[tableName];
    if (!table) throw new Error(`Table ${tableName} not found`);

    const [result] = await db.update(table).set(data).where(eq(table.id, parseInt(id))).returning();
    return result;
  }

  async deleteRecord(tableName: string, id: string): Promise<void> {
    const tableMap: Record<string, any> = {
      accounts, campaigns, donations, dailyEntries, dailyWinners,
      admins, platformSettings, networkFees, footerLinks, announcements, adminLogs
    };
    
    const table = tableMap[tableName];
    if (!table) throw new Error(`Table ${tableName} not found`);

    await db.delete(table).where(eq(table.id, parseInt(id)));
  }

  async exportTableData(tableName: string): Promise<any[]> {
    const tableMap: Record<string, any> = {
      accounts, campaigns, donations, dailyEntries, dailyWinners,
      admins, platformSettings, networkFees, footerLinks, announcements, adminLogs
    };
    
    const table = tableMap[tableName];
    if (!table) throw new Error(`Table ${tableName} not found`);

    return await db.select().from(table);
  }










  // ===== NEW ADMIN ENDPOINTS IMPLEMENTATIONS =====
  
  // Transactions Management
  async getTransactions(filters: any, page: number, limit: number): Promise<Transaction[]> {
    const offset = (page - 1) * limit;
    let query = db.select().from(transactions);
    
    // Apply filters if provided
    if (filters.status) {
      query = query.where(eq(transactions.status, filters.status));
    }
    
    return await query
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return transaction || undefined;
  }
  
  // Wallets Management
  async getWallets(filters: any, page: number, limit: number): Promise<Wallet[]> {
    const offset = (page - 1) * limit;
    let query = db.select().from(wallets);
    
    // Apply filters if provided
    if (filters.ownerType) {
      query = query.where(eq(wallets.ownerType, filters.ownerType));
    }
    if (filters.address) {
      query = query.where(eq(wallets.address, filters.address));
    }
    
    return await query
      .orderBy(desc(wallets.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getBalancesSummary(scope: string, id: string): Promise<any> {
    // Placeholder implementation - customize based on your balance tracking needs
    return {
      totalBalance: "0",
      tokenBalances: {},
      scope,
      id
    };
  }
  
  // Enhanced Daily Rewards Management
  async getDailyRewards(page: number, limit: number): Promise<DailyReward[]> {
    const offset = (page - 1) * limit;
    return await db
      .select()
      .from(dailyRewards)
      .orderBy(desc(dailyRewards.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateDailyRewardAmount(id: number, amount: string): Promise<void> {
    await db
      .update(dailyRewards)
      .set({ prizeAmountUsdt: amount })
      .where(eq(dailyRewards.id, id));
  }

  async getDailyRewardParticipants(dailyRewardId: number): Promise<DailyParticipant[]> {
    return await db
      .select()
      .from(dailyParticipants)
      .where(eq(dailyParticipants.dailyRewardId, dailyRewardId))
      .orderBy(desc(dailyParticipants.joinedAt));
  }

  async setDailyRewardWinner(dailyRewardId: number, wallet: string, selectedBy: number): Promise<void> {
    await db
      .update(dailyRewards)
      .set({ 
        winnerWallet: wallet,
        selectedBy,
        isClosed: true,
        selectedAt: new Date()
      })
      .where(eq(dailyRewards.id, dailyRewardId));
  }

  async closeDailyReward(id: number): Promise<void> {
    await db
      .update(dailyRewards)
      .set({ isClosed: true })
      .where(eq(dailyRewards.id, id));
  }

  async openDailyReward(id: number): Promise<void> {
    await db
      .update(dailyRewards)
      .set({ isClosed: false })
      .where(eq(dailyRewards.id, id));
  }
  
  // Enhanced Campaigns Management
  async getAdminCampaigns(filters: any, page: number, limit: number): Promise<Campaign[]> {
    const offset = (page - 1) * limit;
    let query = db.select().from(campaigns);
    
    // Apply filters if provided - use approved field instead of status
    if (filters.status === 'approved') {
      query = query.where(eq(campaigns.approved, true));
    } else if (filters.status === 'pending') {
      query = query.where(eq(campaigns.approved, false));
    }
    if (filters.type) {
      query = query.where(eq(campaigns.campaignType, filters.type));
    }
    
    return await query
      .orderBy(desc(campaigns.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async rejectCampaign(id: number, adminId: number): Promise<void> {
    await db
      .update(campaigns)
      .set({ 
        approved: false,
        approvedBy: adminId,
        approvedAt: new Date()
      })
      .where(eq(campaigns.id, id));
  }

  async toggleCampaignCompanyVisibility(id: number): Promise<void> {
    // This would toggle a visibility flag for company information
    // Implementation depends on your specific company visibility field
    const campaign = await this.getCampaign(id);
    if (campaign) {
      await db
        .update(campaigns)
        .set({ 
          // Toggle visibility field when it's added to schema
          updatedAt: new Date()
        })
        .where(eq(campaigns.id, id));
    }
  }
  
  
  // Enhanced Admin Logs
  async getAdminLogs(filters: any, page: number, limit: number): Promise<AdminLog[]> {
    const offset = (page - 1) * limit;
    let query = db.select().from(adminLogs);
    
    // Apply filters if provided
    if (filters.adminId) {
      query = query.where(eq(adminLogs.adminId, parseInt(filters.adminId)));
    }
    if (filters.action) {
      query = query.where(eq(adminLogs.action, filters.action));
    }
    
    return await query
      .orderBy(desc(adminLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Payment Attempts Management
  async createPaymentAttempt(attempt: InsertPaymentAttempt): Promise<PaymentAttempt> {
    const [newAttempt] = await db.insert(paymentAttempts).values(attempt).returning();
    return newAttempt;
  }

  async getPaymentAttemptsByWallet(wallet: string): Promise<PaymentAttempt[]> {
    return await db.select().from(paymentAttempts)
      .where(eq(paymentAttempts.initiatorWallet, wallet))
      .orderBy(desc(paymentAttempts.attemptedAt));
  }

  async getPaymentAttemptsByCampaign(campaignId: number): Promise<PaymentAttempt[]> {
    return await db.select().from(paymentAttempts)
      .where(eq(paymentAttempts.campaignId, campaignId))
      .orderBy(desc(paymentAttempts.attemptedAt));
  }

  // ===== USER AUTHENTICATION (SIWE) IMPLEMENTATIONS =====
  
  // User Nonces Management
  async createUserNonce(nonce: InsertUserNonce): Promise<UserNonce> {
    const [newNonce] = await db.insert(userNonces).values(nonce).returning();
    return newNonce;
  }

  async getUserNonce(nonce: string): Promise<UserNonce | undefined> {
    const [userNonce] = await db.select().from(userNonces)
      .where(and(
        eq(userNonces.nonce, nonce),
        eq(userNonces.used, false),
        gt(userNonces.expiresAt, new Date())
      ));
    return userNonce || undefined;
  }

  async markNonceAsUsed(id: number): Promise<void> {
    await db.update(userNonces)
      .set({ used: true })
      .where(eq(userNonces.id, id));
  }

  async cleanupExpiredNonces(): Promise<void> {
    await db.delete(userNonces)
      .where(and(
        eq(userNonces.used, true)
      ));
    
    // Also cleanup expired unused nonces
    await db.delete(userNonces)
      .where(and(
        eq(userNonces.used, false),
        sql`${userNonces.expiresAt} < NOW()`
      ));
  }

  // User Sessions Management
  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [newSession] = await db.insert(userSessions).values(session).returning();
    return newSession;
  }

  async getUserSession(sessionId: string): Promise<UserSession | undefined> {
    const [session] = await db.select().from(userSessions)
      .where(and(
        eq(userSessions.sessionId, sessionId),
        eq(userSessions.active, true),
        gt(userSessions.expiresAt, new Date())
      ));
    return session || undefined;
  }

  async getUserSessionsByWallet(wallet: string): Promise<UserSession[]> {
    return await db.select().from(userSessions)
      .where(and(
        eq(userSessions.wallet, wallet),
        eq(userSessions.active, true),
        gt(userSessions.expiresAt, new Date())
      ))
      .orderBy(desc(userSessions.createdAt));
  }

  async updateSessionLastUsed(sessionId: string): Promise<void> {
    await db.update(userSessions)
      .set({ lastUsedAt: new Date() })
      .where(eq(userSessions.sessionId, sessionId));
  }

  async invalidateUserSession(sessionId: string): Promise<void> {
    await db.update(userSessions)
      .set({ active: false })
      .where(eq(userSessions.sessionId, sessionId));
  }

  async invalidateAllUserSessions(wallet: string): Promise<void> {
    await db.update(userSessions)
      .set({ active: false })
      .where(eq(userSessions.wallet, wallet));
  }

  async cleanupExpiredSessions(): Promise<void> {
    await db.delete(userSessions)
      .where(or(
        eq(userSessions.active, false),
        sql`${userSessions.expiresAt} < NOW()`
      ));
  }

  // Transaction Idempotency Implementation (Security)
  async createUsedTransaction(transaction: InsertUsedTransaction): Promise<UsedTransaction> {
    const [newTransaction] = await db.insert(usedTransactions).values(transaction).returning();
    return newTransaction;
  }

  async isTransactionUsed(txHash: string): Promise<boolean> {
    const [existingTx] = await db.select().from(usedTransactions)
      .where(eq(usedTransactions.txHash, txHash));
    return !!existingTx;
  }

  async getUsedTransaction(txHash: string): Promise<UsedTransaction | undefined> {
    const [transaction] = await db.select().from(usedTransactions)
      .where(eq(usedTransactions.txHash, txHash));
    return transaction || undefined;
  }
  
  // ===== USER ANALYTICS DASHBOARD =====
  
  // Get user donation history with filtering
  async getUserDonationHistory(wallet: string, filters?: any): Promise<any[]> {
    const conditions = [eq(donations.donorWallet, wallet)];
    
    // Build conditions array to avoid overwriting filters
    if (filters?.startDate) {
      conditions.push(gte(donations.createdAt, new Date(filters.startDate)));
    }
    
    if (filters?.endDate) {
      conditions.push(lte(donations.createdAt, new Date(filters.endDate)));
    }
    
    if (filters?.minAmount) {
      conditions.push(gte(donations.amount, filters.minAmount.toString()));
    }
    
    if (filters?.campaignType) {
      conditions.push(eq(campaigns.campaignType, filters.campaignType));
    }
    
    const query = db.select({
      id: donations.id,
      amount: donations.amount,
      txHash: donations.txHash,
      network: donations.network,
      createdAt: donations.createdAt,
      campaignId: donations.campaignId,
      campaignTitle: campaigns.title,
      campaignType: campaigns.campaignType,
      campaignOwner: campaigns.ownerWallet
    })
    .from(donations)
    .innerJoin(campaigns, eq(donations.campaignId, campaigns.id))
    .where(and(...conditions));
    
    return await query.orderBy(desc(donations.createdAt)).limit(filters?.limit || 100);
  }
  
  // Get comprehensive user donation statistics
  async getUserDonationStats(wallet: string): Promise<any> {
    const [donationStats] = await db.select({
      totalDonated: sql<string>`COALESCE(SUM(${donations.amount}), 0)`,
      donationCount: sql<number>`COUNT(*)`,
      avgDonation: sql<string>`COALESCE(AVG(${donations.amount}), 0)`,
      firstDonation: sql<Date>`MIN(${donations.createdAt})`,
      lastDonation: sql<Date>`MAX(${donations.createdAt})`
    })
    .from(donations)
    .where(eq(donations.donorWallet, wallet));
    
    // Get donations by campaign type
    const donationsByType = await db.select({
      campaignType: campaigns.campaignType,
      count: sql<number>`COUNT(*)`,
      total: sql<string>`SUM(${donations.amount})`
    })
    .from(donations)
    .innerJoin(campaigns, eq(donations.campaignId, campaigns.id))
    .where(eq(donations.donorWallet, wallet))
    .groupBy(campaigns.campaignType);
    
    // Get donations by network
    const donationsByNetwork = await db.select({
      network: donations.network,
      count: sql<number>`COUNT(*)`,
      total: sql<string>`SUM(${donations.amount})`
    })
    .from(donations)
    .where(eq(donations.donorWallet, wallet))
    .groupBy(donations.network);
    
    return {
      overview: donationStats,
      byType: donationsByType,
      byNetwork: donationsByNetwork
    };
  }
  
  // Get analytics for a specific campaign
  async getCampaignAnalytics(campaignId: number): Promise<any> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
    if (!campaign) throw new Error('Campaign not found');
    
    // Get daily donation trends (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyTrends = await db.select({
      date: sql<string>`DATE(${donations.createdAt}) as date`,
      donationCount: sql<number>`COUNT(*)`,
      totalAmount: sql<string>`SUM(${donations.amount})`
    })
    .from(donations)
    .where(and(
      eq(donations.campaignId, campaignId),
      gte(donations.createdAt, thirtyDaysAgo)
    ))
    .groupBy(sql`DATE(${donations.createdAt})`)
    .orderBy(sql`DATE(${donations.createdAt})`);
    
    // Get top donors
    const topDonors = await db.select({
      donorWallet: donations.donorWallet,
      totalDonated: sql<string>`SUM(${donations.amount})`,
      donationCount: sql<number>`COUNT(*)`
    })
    .from(donations)
    .where(eq(donations.campaignId, campaignId))
    .groupBy(donations.donorWallet)
    .orderBy(desc(sql<string>`SUM(${donations.amount})`))
    .limit(10);
    
    // Calculate progress percentage
    const progress = campaign.targetAmount ? 
      (parseFloat(campaign.totalDonations || '0') / parseFloat(campaign.targetAmount)) * 100 : 0;
    
    return {
      campaign: {
        ...campaign,
        progress: Math.min(progress, 100)
      },
      dailyTrends,
      topDonors,
      performance: {
        averageDonation: topDonors.length > 0 ? 
          parseFloat(campaign.totalDonations || '0') / (campaign.donationCount || 1) : 0,
        conversionRate: 100 // This would need view tracking to calculate properly
      }
    };
  }
  
  // Get analytics for all user's campaigns
  async getUserCampaignAnalytics(wallet: string): Promise<any> {
    const userCampaigns = await db.select().from(campaigns)
      .where(eq(campaigns.ownerWallet, wallet))
      .orderBy(desc(campaigns.createdAt));
    
    if (userCampaigns.length === 0) {
      return {
        overview: {
          totalCampaigns: 0,
          totalRaised: '0',
          totalDonors: 0,
          avgCampaignAmount: '0',
          successRate: 0
        },
        campaigns: [],
        monthlyTrends: []
      };
    }
    
    // Calculate overview stats
    const totalRaised = userCampaigns.reduce((sum, c) => 
      sum + parseFloat(c.totalDonations || '0'), 0);
    const totalDonors = userCampaigns.reduce((sum, c) => 
      sum + (c.donationCount || 0), 0);
    const successfulCampaigns = userCampaigns.filter(c => {
      if (!c.targetAmount || !c.totalDonations) return false;
      return parseFloat(c.totalDonations) >= parseFloat(c.targetAmount);
    }).length;
    
    // Get monthly campaign creation trends (last 6 months)
    const monthlyTrends = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const monthCampaigns = userCampaigns.filter(c => {
        const createdAt = new Date(c.createdAt!);
        return createdAt >= date && createdAt < nextMonth;
      });
      
      const monthlyRaised = monthCampaigns.reduce((sum, c) => 
        sum + parseFloat(c.totalDonations || '0'), 0);
      
      monthlyTrends.push({
        month: monthKey,
        campaignsCreated: monthCampaigns.length,
        totalRaised: monthlyRaised.toString(),
        avgPerCampaign: monthCampaigns.length > 0 ? 
          (monthlyRaised / monthCampaigns.length).toString() : '0'
      });
    }
    
    return {
      overview: {
        totalCampaigns: userCampaigns.length,
        totalRaised: totalRaised.toString(),
        totalDonors,
        avgCampaignAmount: userCampaigns.length > 0 ? 
          (totalRaised / userCampaigns.length).toString() : '0',
        successRate: userCampaigns.length > 0 ? 
          (successfulCampaigns / userCampaigns.length) * 100 : 0
      },
      campaigns: userCampaigns.map(c => ({
        ...c,
        progress: c.targetAmount ? 
          Math.min((parseFloat(c.totalDonations || '0') / parseFloat(c.targetAmount)) * 100, 100) : 0
      })),
      monthlyTrends
    };
  }
  
  // Get time-based analytics for user
  async getUserTimeAnalytics(wallet: string, timeRange: string): Promise<any> {
    let startDate: Date;
    const now = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Get donation activity for time range
    const donationActivity = await db.select({
      date: sql<string>`DATE(${donations.createdAt})`,
      count: sql<number>`COUNT(*)`,
      amount: sql<string>`SUM(${donations.amount})`
    })
    .from(donations)
    .where(and(
      eq(donations.donorWallet, wallet),
      gte(donations.createdAt, startDate)
    ))
    .groupBy(sql`DATE(${donations.createdAt})`)
    .orderBy(sql`DATE(${donations.createdAt})`);
    
    // Get campaign creation activity for time range
    const campaignActivity = await db.select({
      date: sql<string>`DATE(${campaigns.createdAt})`,
      count: sql<number>`COUNT(*)`
    })
    .from(campaigns)
    .where(and(
      eq(campaigns.ownerWallet, wallet),
      gte(campaigns.createdAt, startDate)
    ))
    .groupBy(sql`DATE(${campaigns.createdAt})`)
    .orderBy(sql`DATE(${campaigns.createdAt})`);
    
    // Get daily reward participation for time range
    const rewardActivity = await db.select({
      date: dailyEntries.date,
      count: sql<number>`COUNT(*)`
    })
    .from(dailyEntries)
    .where(and(
      eq(dailyEntries.wallet, wallet),
      gte(sql`STR_TO_DATE(${dailyEntries.date}, '%Y-%m-%d')`, startDate)
    ))
    .groupBy(dailyEntries.date)
    .orderBy(dailyEntries.date);
    
    return {
      timeRange,
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      donations: donationActivity,
      campaigns: campaignActivity,
      dailyRewards: rewardActivity,
      summary: {
        totalDonations: donationActivity.reduce((sum, d) => sum + parseInt(d.count.toString()), 0),
        totalDonated: donationActivity.reduce((sum, d) => sum + parseFloat(d.amount), 0).toString(),
        totalCampaigns: campaignActivity.reduce((sum, c) => sum + parseInt(c.count.toString()), 0),
        totalRewardDays: rewardActivity.reduce((sum, r) => sum + parseInt(r.count.toString()), 0)
      }
    };
  }

  // Pending Payments (Auto Campaign Creation)
  async addPendingPayment(payment: InsertPendingPayment): Promise<PendingPayment> {
    const [result] = await db.insert(pendingPayments).values(payment).returning();
    return result;
  }

  async getPendingPayments(status?: string): Promise<PendingPayment[]> {
    if (status) {
      return await db.select().from(pendingPayments).where(eq(pendingPayments.status, status));
    }
    return await db.select().from(pendingPayments);
  }

  async updatePendingPayment(id: number, updates: Partial<PendingPayment>): Promise<void> {
    await db.update(pendingPayments).set(updates).where(eq(pendingPayments.id, id));
  }

  async getPendingByTxHash(txHash: string): Promise<PendingPayment | undefined> {
    const [result] = await db.select().from(pendingPayments).where(eq(pendingPayments.txHash, txHash));
    return result;
  }

  async markPendingConfirmed(id: number): Promise<void> {
    await db.update(pendingPayments).set({ status: 'confirmed' }).where(eq(pendingPayments.id, id));
  }

  async findDuplicatesByTxHash(txHash: string): Promise<PendingPayment[]> {
    return await db.select().from(pendingPayments).where(eq(pendingPayments.txHash, txHash));
  }

  async findByOwnerAmountRecent(ownerWallet: string, amount: string, hours: number): Promise<PendingPayment[]> {
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await db.select().from(pendingPayments)
      .where(and(
        eq(pendingPayments.ownerWallet, ownerWallet),
        eq(pendingPayments.expectedAmount, amount),
        gte(pendingPayments.createdAt, hoursAgo)
      ));
  }

  // ===== FUND KYB & VERIFICATION IMPLEMENTATIONS =====
  
  // Corporate Verification Management
  async createCorporateVerification(verification: InsertCorporateVerification): Promise<CorporateVerification> {
    const [result] = await db.insert(corporateVerifications).values(verification).returning();
    return result;
  }

  async getCorporateVerification(wallet: string): Promise<CorporateVerification | undefined> {
    const [result] = await db.select().from(corporateVerifications).where(eq(corporateVerifications.wallet, wallet));
    return result;
  }

  async getCorporateVerificationById(id: number): Promise<CorporateVerification | undefined> {
    const [result] = await db.select().from(corporateVerifications).where(eq(corporateVerifications.id, id));
    return result;
  }

  async updateCorporateVerification(id: number, updates: Partial<CorporateVerification>): Promise<void> {
    await db.update(corporateVerifications).set({ ...updates, updatedAt: new Date() }).where(eq(corporateVerifications.id, id));
  }

  async deleteCorporateVerification(id: number): Promise<void> {
    await db.delete(fundDocuments).where(eq(fundDocuments.verificationId, id));
    await db.delete(corporateVerifications).where(eq(corporateVerifications.id, id));
  }

  async getAllCorporateVerifications(status?: string): Promise<CorporateVerification[]> {
    if (status) {
      return await db.select().from(corporateVerifications).where(eq(corporateVerifications.status, status as any));
    }
    return await db.select().from(corporateVerifications).orderBy(desc(corporateVerifications.createdAt));
  }

  async approveCorporateVerification(id: number, adminId: number, notes?: string): Promise<void> {
    // Start transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Approve the verification
      await tx.update(corporateVerifications).set({
        status: 'approved',
        verifiedBy: adminId,
        verifiedAt: new Date(),
        adminNotes: notes,
        updatedAt: new Date()
      }).where(eq(corporateVerifications.id, id));

      // Auto-publish any pending funds for this verification
      await this.autoPublishPendingFunds(id, adminId, tx);
    });
  }

  async rejectCorporateVerification(id: number, adminId: number, reason: string): Promise<void> {
    // Start transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Reject the verification
      await tx.update(corporateVerifications).set({
        status: 'rejected',
        verifiedBy: adminId,
        verifiedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date()
      }).where(eq(corporateVerifications.id, id));

      // Update pending funds status to rejected
      await tx.update(pendingFunds).set({
        status: 'rejected',
        updatedAt: new Date()
      }).where(eq(pendingFunds.verificationId, id));
    });
  }

  // ===== AUTO-PUBLISH SYSTEM FOR APPROVED FUNDS =====

  async autoPublishPendingFunds(verificationId: number, adminId: number, tx: any): Promise<void> {
    // Get all approved pending funds for this verification
    const approvedFunds = await tx.select().from(pendingFunds)
      .where(and(
        eq(pendingFunds.verificationId, verificationId),
        eq(pendingFunds.status, 'awaiting_review'),
        eq(pendingFunds.collateralPaid, true)
      ));

    for (const pendingFund of approvedFunds) {
      try {
        // Create campaign from pending fund
        const campaignId = await this.createCampaignFromPendingFund(pendingFund, adminId, tx);
        
        // Update pending fund status to published
        await tx.update(pendingFunds).set({
          status: 'published',
          publishedCampaignId: campaignId,
          updatedAt: new Date()
        }).where(eq(pendingFunds.id, pendingFund.id));

        console.log(`✅ Auto-published FUND campaign ${campaignId} from pending fund ${pendingFund.id}`);
      } catch (error) {
        console.error(`❌ Failed to auto-publish pending fund ${pendingFund.id}:`, error);
        // Mark as failed but continue with other funds
        await tx.update(pendingFunds).set({
          status: 'auto_publish_failed',
          updatedAt: new Date()
        }).where(eq(pendingFunds.id, pendingFund.id));
      }
    }
  }

  async createCampaignFromPendingFund(pendingFund: any, approvedBy: number, tx: any): Promise<number> {
    const campaignData = JSON.parse(pendingFund.campaignData);
    
    // Create campaign with approved status
    const [newCampaign] = await tx.insert(campaigns).values({
      ...campaignData,
      approved: true,
      approvedBy,
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning({ id: campaigns.id });

    return newCampaign.id;
  }

  async updatePendingFundStatus(id: number, status: string): Promise<void> {
    await db.update(pendingFunds).set({
      status,
      updatedAt: new Date()
    }).where(eq(pendingFunds.id, id));
  }

  async getPendingFundsForVerification(verificationId: number): Promise<any[]> {
    return await db.select().from(pendingFunds)
      .where(eq(pendingFunds.verificationId, verificationId))
      .orderBy(desc(pendingFunds.createdAt));
  }

  // ===== FUNDS WITH VERIFICATION STATUS =====
  
  async getFundCampaignsWithVerification(): Promise<any[]> {
    // Get all FUND campaigns with their verification status
    const fundCampaigns = await db
      .select({
        // Campaign fields
        id: campaigns.id,
        title: campaigns.title,
        description: campaigns.description,
        imageUrl: campaigns.imageUrl,
        ownerWallet: campaigns.ownerWallet,
        campaignType: campaigns.campaignType,
        creatorType: campaigns.creatorType,
        targetAmount: campaigns.targetAmount,
        totalDonations: campaigns.totalDonations,
        donationCount: campaigns.donationCount,
        featured: campaigns.featured,
        active: campaigns.active,
        approved: campaigns.approved,
        approvedBy: campaigns.approvedBy,
        approvedAt: campaigns.approvedAt,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        creditCardEnabled: campaigns.creditCardEnabled,
        
        // Verification status from corporate verifications
        verificationStatus: corporateVerifications.status,
        verificationId: corporateVerifications.id,
        verifiedAt: corporateVerifications.verifiedAt,
        verifiedBy: corporateVerifications.verifiedBy,
        companyName: corporateVerifications.companyName,
      })
      .from(campaigns)
      .leftJoin(
        corporateVerifications,
        eq(campaigns.ownerWallet, corporateVerifications.wallet)
      )
      .where(
        and(
          eq(campaigns.campaignType, 'FUND'),
          eq(campaigns.active, true)
        )
      )
      .orderBy(desc(campaigns.createdAt));

    return fundCampaigns;
  }

  // Document Management
  async uploadFundDocument(document: InsertFundDocument): Promise<FundDocument> {
    const [result] = await db.insert(fundDocuments).values(document).returning();
    return result;
  }

  async getFundDocuments(verificationId: number): Promise<FundDocument[]> {
    return await db.select().from(fundDocuments).where(eq(fundDocuments.verificationId, verificationId)).orderBy(desc(fundDocuments.createdAt));
  }

  async getFundDocument(id: number): Promise<FundDocument | undefined> {
    const [result] = await db.select().from(fundDocuments).where(eq(fundDocuments.id, id));
    return result;
  }

  async deleteFundDocument(id: number): Promise<void> {
    await db.delete(fundDocuments).where(eq(fundDocuments.id, id));
  }

  // Pending Funds Management
  async createPendingFund(fund: InsertPendingFund): Promise<PendingFund> {
    const [result] = await db.insert(pendingFunds).values(fund).returning();
    return result;
  }

  async getPendingFund(id: number): Promise<PendingFund | undefined> {
    const [result] = await db.select().from(pendingFunds).where(eq(pendingFunds.id, id));
    return result;
  }

  async getPendingFundsByWallet(wallet: string): Promise<PendingFund[]> {
    return await db.select().from(pendingFunds).where(eq(pendingFunds.wallet, wallet)).orderBy(desc(pendingFunds.createdAt));
  }

  async getPendingFundsByStatus(status: string): Promise<PendingFund[]> {
    return await db.select().from(pendingFunds).where(eq(pendingFunds.status, status)).orderBy(desc(pendingFunds.createdAt));
  }

  async updatePendingFund(id: number, updates: Partial<PendingFund>): Promise<void> {
    await db.update(pendingFunds).set({ ...updates, updatedAt: new Date() }).where(eq(pendingFunds.id, id));
  }

  async markPendingFundAsPublished(id: number, campaignId: number): Promise<void> {
    await db.update(pendingFunds).set({
      status: 'published',
      publishedCampaignId: campaignId,
      updatedAt: new Date()
    }).where(eq(pendingFunds.id, id));
  }

  // ===== COMPANY BALANCE SYSTEM IMPLEMENTATION =====

  // Company Balance Operations
  async getCompanyBalance(wallet: string): Promise<{ available: string; reserved: string; total: string } | undefined> {
    const [account] = await db.select({
      balanceAvailable: accounts.balanceAvailable,
      balanceReserved: accounts.balanceReserved
    }).from(accounts).where(eq(accounts.wallet, wallet));

    if (!account) return undefined;

    const available = account.balanceAvailable || "0";
    const reserved = account.balanceReserved || "0";
    const total = (parseFloat(available) + parseFloat(reserved)).toString();

    return { available, reserved, total };
  }

  async creditBalance(wallet: string, amount: string, reason: string, refId?: number, refType?: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get current balance
      const [account] = await tx.select({
        balanceAvailable: accounts.balanceAvailable
      }).from(accounts).where(eq(accounts.wallet, wallet));

      const currentBalance = account?.balanceAvailable || "0";
      const newBalance = (parseFloat(currentBalance) + parseFloat(amount)).toString();

      // Update balance
      await tx.update(accounts).set({
        balanceAvailable: newBalance,
        updatedAt: new Date()
      }).where(eq(accounts.wallet, wallet));

      // Record transaction
      await tx.insert(balanceLedger).values({
        wallet,
        type: "credit",
        amount,
        reason,
        refId,
        refType,
        balanceBefore: currentBalance,
        balanceAfter: newBalance
      });
    });
  }

  async debitBalance(wallet: string, amount: string, reason: string, refId?: number, refType?: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get current balance
      const [account] = await tx.select({
        balanceAvailable: accounts.balanceAvailable
      }).from(accounts).where(eq(accounts.wallet, wallet));

      const currentBalance = account?.balanceAvailable || "0";
      const newBalance = (parseFloat(currentBalance) - parseFloat(amount)).toString();

      if (parseFloat(newBalance) < 0) {
        throw new Error("Insufficient balance");
      }

      // Update balance
      await tx.update(accounts).set({
        balanceAvailable: newBalance,
        updatedAt: new Date()
      }).where(eq(accounts.wallet, wallet));

      // Record transaction
      await tx.insert(balanceLedger).values({
        wallet,
        type: "debit",
        amount,
        reason,
        refId,
        refType,
        balanceBefore: currentBalance,
        balanceAfter: newBalance
      });
    });
  }

  async updateBalanceFields(wallet: string, availableDelta: string, reservedDelta: string): Promise<void> {
    await db.transaction(async (tx) => {
      const [account] = await tx.select({
        balanceAvailable: accounts.balanceAvailable,
        balanceReserved: accounts.balanceReserved
      }).from(accounts).where(eq(accounts.wallet, wallet));

      const currentAvailable = account?.balanceAvailable || "0";
      const currentReserved = account?.balanceReserved || "0";
      
      const newAvailable = (parseFloat(currentAvailable) + parseFloat(availableDelta)).toString();
      const newReserved = (parseFloat(currentReserved) + parseFloat(reservedDelta)).toString();

      if (parseFloat(newAvailable) < 0 || parseFloat(newReserved) < 0) {
        throw new Error("Invalid balance operation");
      }

      await tx.update(accounts).set({
        balanceAvailable: newAvailable,
        balanceReserved: newReserved,
        updatedAt: new Date()
      }).where(eq(accounts.wallet, wallet));
    });
  }

  // Collateral Reservation Operations
  async reserveCollateral(campaignId: number, wallet: string, amount: string): Promise<CollateralReservation> {
    return await db.transaction(async (tx) => {
      // Check available balance
      const [account] = await tx.select({
        balanceAvailable: accounts.balanceAvailable
      }).from(accounts).where(eq(accounts.wallet, wallet));

      const availableBalance = account?.balanceAvailable || "0";
      
      if (parseFloat(availableBalance) < parseFloat(amount)) {
        throw new Error("Insufficient available balance for collateral");
      }

      // Move funds from available to reserved
      await this.updateBalanceFields(wallet, `-${amount}`, amount);

      // Create collateral reservation
      const [reservation] = await tx.insert(collateralReservations).values({
        campaignId,
        wallet,
        amount,
        status: "active"
      }).returning();

      // Record balance transaction
      await tx.insert(balanceLedger).values({
        wallet,
        type: "debit",
        amount,
        reason: "COLLATERAL_RESERVE",
        refId: reservation.id,
        refType: "collateral_reservation",
        balanceBefore: availableBalance,
        balanceAfter: (parseFloat(availableBalance) - parseFloat(amount)).toString()
      });

      return reservation;
    });
  }

  async releaseCollateral(campaignId: number, wallet?: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Find active reservation
      const whereClause = wallet 
        ? and(eq(collateralReservations.campaignId, campaignId), eq(collateralReservations.wallet, wallet))
        : eq(collateralReservations.campaignId, campaignId);

      const [reservation] = await tx.select()
        .from(collateralReservations)
        .where(and(whereClause, eq(collateralReservations.status, "active")));

      if (!reservation) return;

      // Move funds from reserved back to available
      await this.updateBalanceFields(reservation.wallet, reservation.amount, `-${reservation.amount}`);

      // Mark reservation as released
      await tx.update(collateralReservations).set({
        status: "released",
        releasedAt: new Date()
      }).where(eq(collateralReservations.id, reservation.id));

      // Record balance transaction
      const [account] = await tx.select({
        balanceAvailable: accounts.balanceAvailable
      }).from(accounts).where(eq(accounts.wallet, reservation.wallet));

      await tx.insert(balanceLedger).values({
        wallet: reservation.wallet,
        type: "credit",
        amount: reservation.amount,
        reason: "COLLATERAL_RELEASE",
        refId: reservation.id,
        refType: "collateral_reservation",
        balanceBefore: account?.balanceAvailable || "0",
        balanceAfter: (parseFloat(account?.balanceAvailable || "0") + parseFloat(reservation.amount)).toString()
      });
    });
  }

  async getCollateralReservations(wallet?: string, campaignId?: number, status?: string): Promise<CollateralReservation[]> {
    let query = db.select().from(collateralReservations);
    
    const conditions = [];
    if (wallet) conditions.push(eq(collateralReservations.wallet, wallet));
    if (campaignId) conditions.push(eq(collateralReservations.campaignId, campaignId));
    if (status) conditions.push(eq(collateralReservations.status, status));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(collateralReservations.createdAt));
  }

  async getCollateralReservation(campaignId: number): Promise<CollateralReservation | undefined> {
    const [reservation] = await db.select()
      .from(collateralReservations)
      .where(and(
        eq(collateralReservations.campaignId, campaignId),
        eq(collateralReservations.status, "active")
      ));
    return reservation;
  }

  // Payment Intent Operations
  async createPaymentIntent(intent: InsertPaymentIntent): Promise<PaymentIntent> {
    const [result] = await db.insert(paymentIntents).values(intent).returning();
    return result;
  }

  async getPaymentIntent(id: number): Promise<PaymentIntent | undefined> {
    const [result] = await db.select().from(paymentIntents).where(eq(paymentIntents.id, id));
    return result;
  }

  async getPaymentIntentByTxHash(txHash: string): Promise<PaymentIntent | undefined> {
    const [result] = await db.select().from(paymentIntents).where(eq(paymentIntents.txHash, txHash));
    return result;
  }

  async updatePaymentIntent(id: number, updates: Partial<PaymentIntent>): Promise<void> {
    await db.update(paymentIntents).set(updates).where(eq(paymentIntents.id, id));
  }

  async confirmPaymentIntent(id: number, txHash?: string, stripeData?: any): Promise<void> {
    const updates: Partial<PaymentIntent> = {
      status: "confirmed",
      confirmedAt: new Date()
    };
    
    if (txHash) updates.txHash = txHash;
    if (stripeData) {
      updates.stripeSessionId = stripeData.sessionId;
      updates.stripePaymentIntentId = stripeData.paymentIntentId;
    }

    await db.update(paymentIntents).set(updates).where(eq(paymentIntents.id, id));
  }

  async getPaymentIntentsByWallet(wallet: string, status?: string): Promise<PaymentIntent[]> {
    let query = db.select().from(paymentIntents).where(eq(paymentIntents.wallet, wallet));
    
    if (status) {
      query = query.where(and(eq(paymentIntents.wallet, wallet), eq(paymentIntents.status, status)));
    }
    
    return await query.orderBy(desc(paymentIntents.createdAt));
  }

  // Balance Ledger Operations
  async recordBalanceTransaction(entry: InsertBalanceLedger): Promise<BalanceLedger> {
    const [result] = await db.insert(balanceLedger).values(entry).returning();
    return result;
  }

  async getBalanceHistory(wallet: string, limit: number = 50): Promise<BalanceLedger[]> {
    return await db.select()
      .from(balanceLedger)
      .where(eq(balanceLedger.wallet, wallet))
      .orderBy(desc(balanceLedger.createdAt))
      .limit(limit);
  }

  async getBalanceTransactionsByReason(wallet: string, reason: string): Promise<BalanceLedger[]> {
    return await db.select()
      .from(balanceLedger)
      .where(and(
        eq(balanceLedger.wallet, wallet),
        eq(balanceLedger.reason, reason)
      ))
      .orderBy(desc(balanceLedger.createdAt));
  }
}

export const storage = new DatabaseStorage();