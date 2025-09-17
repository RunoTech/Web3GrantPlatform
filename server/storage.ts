import { db } from "./db";
import { eq, desc, and, sql, gt } from "drizzle-orm";
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
  type AffiliateActivity, type InsertAffiliateActivity,
  type AffiliateApplication, type InsertAffiliateApplication,
  type Wallet, type InsertWallet,
  type Transaction, type InsertTransaction,
  type DailyReward, type InsertDailyReward,
  type DailyParticipant, type InsertDailyParticipant,
  type PaymentAttempt, type InsertPaymentAttempt,
  type UserNonce, type InsertUserNonce,
  type UserSession, type InsertUserSession,
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
  affiliateActivities,
  affiliateApplications,
  wallets,
  transactions,
  dailyRewards,
  dailyParticipants,
  paymentAttempts,
  userNonces,
  userSessions,
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
  getCampaigns(limit?: number, offset?: number): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
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

  // Affiliate System
  generateReferralCode(wallet: string): Promise<string>;
  getAccountWithAffiliateData(wallet: string): Promise<Account | undefined>;
  updateAccountAffiliateData(wallet: string, updates: Partial<Account>): Promise<void>;
  activateAffiliateSystem(wallet: string, activityType: 'donation' | 'campaign_creation', relatedId?: number): Promise<void>;
  getReferralStats(wallet: string): Promise<{ totalReferrals: number; totalEarnings: string; activities: AffiliateActivity[] }>;
  createAffiliateActivity(activity: InsertAffiliateActivity): Promise<AffiliateActivity>;
  getAffiliateActivities(wallet: string): Promise<AffiliateActivity[]>;

  // Affiliate Applications
  createAffiliateApplication(application: InsertAffiliateApplication): Promise<AffiliateApplication>;
  getAffiliateApplication(wallet: string): Promise<AffiliateApplication | undefined>;
  getAllAffiliateApplications(status?: string): Promise<AffiliateApplication[]>;
  updateAffiliateApplicationStatus(id: number, status: string, reviewedBy: number, reviewNotes?: string): Promise<void>;

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
  
  // Enhanced Campaigns Management
  getAdminCampaigns(filters: any, page: number, limit: number): Promise<Campaign[]>;
  rejectCampaign(id: number, adminId: number): Promise<void>;
  toggleCampaignCompanyVisibility(id: number): Promise<void>;
  
  // Enhanced Affiliates Management
  getAffiliateApplications(filters: any, page: number, limit: number): Promise<AffiliateApplication[]>;
  approveAffiliateApplication(id: number, reviewedBy: number, reviewNotes?: string): Promise<void>;
  rejectAffiliateApplication(id: number, reviewedBy: number, reviewNotes?: string): Promise<void>;
  
  // Enhanced Admin Logs
  getAdminLogs(filters: any, page: number, limit: number): Promise<AdminLog[]>;

  // Payment Attempts (for tracking failed payments)
  createPaymentAttempt(attempt: InsertPaymentAttempt): Promise<PaymentAttempt>;
  getPaymentAttemptsByWallet(wallet: string): Promise<PaymentAttempt[]>;
  getPaymentAttemptsByCampaign(campaignId: number): Promise<PaymentAttempt[]>;
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

  // Campaigns
  async getCampaigns(limit: number = 50, offset: number = 0): Promise<Campaign[]> {
    return await db.select().from(campaigns)
      .orderBy(desc(campaigns.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
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
    const [newEntry] = await db.insert(dailyEntries).values(entry).returning();
    return newEntry;
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

  // Affiliate System Implementation
  async generateReferralCode(wallet: string): Promise<string> {
    // Generate a unique referral code based on wallet address and timestamp
    const timestamp = Date.now().toString(36);
    const walletPart = wallet.slice(-6).toUpperCase();
    const referralCode = `${walletPart}${timestamp}`.slice(0, 20);
    
    // Check if code already exists (though unlikely)
    const existing = await db.select().from(accounts).where(eq(accounts.referralCode, referralCode));
    if (existing.length > 0) {
      // If collision, add random suffix
      const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
      return `${referralCode.slice(0, 17)}${randomSuffix}`;
    }
    
    return referralCode;
  }

  async getAccountWithAffiliateData(wallet: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.wallet, wallet));
    return account || undefined;
  }

  async updateAccountAffiliateData(wallet: string, updates: Partial<Account>): Promise<void> {
    await db.update(accounts).set(updates).where(eq(accounts.wallet, wallet));
  }

  async activateAffiliateSystem(wallet: string, activityType: 'donation' | 'campaign_creation', relatedId?: number): Promise<void> {
    const account = await this.getAccount(wallet);
    if (!account) throw new Error('Account not found');

    // If affiliate not already activated, activate it
    if (!account.affiliateActivated) {
      // Generate referral code if not exists
      let referralCode = account.referralCode;
      if (!referralCode) {
        referralCode = await this.generateReferralCode(wallet);
      }

      await this.updateAccountAffiliateData(wallet, {
        referralCode,
        affiliateActivated: true,
        affiliateActivationDate: new Date(),
      });

      // If this user was referred by someone, create affiliate activity
      if (account.referredBy) {
        await this.createAffiliateActivity({
          referrerWallet: account.referredBy,
          referredWallet: wallet,
          activityType,
          relatedId,
          rewardAmount: "0", // Reward system can be configured later
        });

        // Update referrer's total referrals
        await db.update(accounts)
          .set({
            totalReferrals: sql`${accounts.totalReferrals} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(accounts.wallet, account.referredBy));
      }
    }
  }

  async getReferralStats(wallet: string): Promise<{ totalReferrals: number; totalEarnings: string; activities: AffiliateActivity[] }> {
    const account = await this.getAccount(wallet);
    const activities = await this.getAffiliateActivities(wallet);

    return {
      totalReferrals: account?.totalReferrals || 0,
      totalEarnings: account?.totalAffiliateEarnings || "0",
      activities,
    };
  }

  // Detailed affiliate analytics
  async getDetailedAffiliateStats(wallet: string): Promise<{
    overview: {
      totalReferrals: number;
      totalEarnings: string;
      unpaidRewards: string;
      paidRewards: string;
      conversionRate: number;
    };
    breakdown: {
      donations: { count: number; totalReward: string };
      campaigns: { count: number; totalReward: string };
    };
    monthlyStats: Array<{
      month: string;
      referrals: number;
      earnings: string;
    }>;
    recentActivity: AffiliateActivity[];
  }> {
    const account = await this.getAccount(wallet);
    const activities = await this.getAffiliateActivities(wallet);

    // Calculate unpaid vs paid rewards
    const unpaidRewards = activities
      .filter(a => !a.rewardPaid)
      .reduce((sum, a) => sum + parseFloat(a.rewardAmount || "0"), 0);
    
    const paidRewards = activities
      .filter(a => a.rewardPaid)
      .reduce((sum, a) => sum + parseFloat(a.rewardAmount || "0"), 0);

    // Breakdown by activity type
    const donationActivities = activities.filter(a => a.activityType === 'donation');
    const campaignActivities = activities.filter(a => a.activityType === 'campaign_creation');

    // Monthly stats (last 6 months)
    const monthlyStats = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const monthActivities = activities.filter(a => {
        if (!a.createdAt) return false;
        const dateStr = typeof a.createdAt === 'string' ? a.createdAt : a.createdAt.toISOString();
        return dateStr.startsWith(monthKey);
      });
      const monthEarnings = monthActivities.reduce((sum, a) => sum + parseFloat(a.rewardAmount || "0"), 0);
      
      monthlyStats.push({
        month: monthKey,
        referrals: monthActivities.length,
        earnings: monthEarnings.toString()
      });
    }

    return {
      overview: {
        totalReferrals: account?.totalReferrals || 0,
        totalEarnings: account?.totalAffiliateEarnings || "0",
        unpaidRewards: unpaidRewards.toString(),
        paidRewards: paidRewards.toString(),
        conversionRate: activities.length > 0 ? (account?.totalReferrals || 0) / activities.length * 100 : 0
      },
      breakdown: {
        donations: {
          count: donationActivities.length,
          totalReward: donationActivities.reduce((sum, a) => sum + parseFloat(a.rewardAmount || "0"), 0).toString()
        },
        campaigns: {
          count: campaignActivities.length,
          totalReward: campaignActivities.reduce((sum, a) => sum + parseFloat(a.rewardAmount || "0"), 0).toString()
        }
      },
      monthlyStats,
      recentActivity: activities.slice(0, 10) // Last 10 activities
    };
  }

  // Get unpaid rewards
  async getUnpaidRewards(wallet: string): Promise<AffiliateActivity[]> {
    return await db
      .select()
      .from(affiliateActivities)
      .where(
        and(
          eq(affiliateActivities.referrerWallet, wallet),
          eq(affiliateActivities.rewardPaid, false)
        )
      )
      .orderBy(desc(affiliateActivities.createdAt));
  }

  // Get affiliate leaderboard (top performers)
  async getAffiliateLeaderboard(limit: number = 10): Promise<Array<{
    wallet: string;
    totalReferrals: number;
    totalEarnings: string;
    rank: number;
  }>> {
    const topAffiliates = await db
      .select({
        wallet: accounts.wallet,
        totalReferrals: accounts.totalReferrals,
        totalEarnings: accounts.totalAffiliateEarnings
      })
      .from(accounts)
      .where(
        and(
          eq(accounts.affiliateActivated, true),
          gt(accounts.totalReferrals, 0)
        )
      )
      .orderBy(desc(accounts.totalReferrals), desc(accounts.totalAffiliateEarnings))
      .limit(limit);

    return topAffiliates.map((affiliate, index) => ({
      wallet: affiliate.wallet,
      totalReferrals: affiliate.totalReferrals || 0,
      totalEarnings: affiliate.totalEarnings || "0",
      rank: index + 1
    }));
  }

  async createAffiliateActivity(activity: InsertAffiliateActivity): Promise<AffiliateActivity> {
    const [result] = await db.insert(affiliateActivities).values(activity).returning();
    return result;
  }

  async getAffiliateActivities(wallet: string): Promise<AffiliateActivity[]> {
    return await db.select().from(affiliateActivities)
      .where(eq(affiliateActivities.referrerWallet, wallet))
      .orderBy(desc(affiliateActivities.createdAt));
  }

  // Affiliate Application Implementation
  async createAffiliateApplication(application: InsertAffiliateApplication): Promise<AffiliateApplication> {
    const [created] = await db
      .insert(affiliateApplications)
      .values({
        ...application,
        appliedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return created;
  }

  async getAffiliateApplication(wallet: string): Promise<AffiliateApplication | undefined> {
    const [application] = await db
      .select()
      .from(affiliateApplications)
      .where(eq(affiliateApplications.wallet, wallet));
    return application || undefined;
  }

  async getAllAffiliateApplications(status?: string): Promise<AffiliateApplication[]> {
    const query = db.select().from(affiliateApplications);
    
    if (status) {
      return await query.where(eq(affiliateApplications.status, status)).orderBy(desc(affiliateApplications.appliedAt));
    }
    
    return await query.orderBy(desc(affiliateApplications.appliedAt));
  }

  async updateAffiliateApplicationStatus(
    id: number,
    status: string,
    reviewedBy: number,
    reviewNotes?: string
  ): Promise<void> {
    await db
      .update(affiliateApplications)
      .set({
        status,
        reviewedBy,
        reviewNotes,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(affiliateApplications.id, id));
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
  
  // Enhanced Affiliates Management
  async getAffiliateApplications(filters: any, page: number, limit: number): Promise<AffiliateApplication[]> {
    const offset = (page - 1) * limit;
    let query = db.select().from(affiliateApplications);
    
    // Apply filters if provided
    if (filters.status) {
      query = query.where(eq(affiliateApplications.status, filters.status));
    }
    
    return await query
      .orderBy(desc(affiliateApplications.appliedAt))
      .limit(limit)
      .offset(offset);
  }

  async approveAffiliateApplication(id: number, reviewedBy: number, reviewNotes?: string): Promise<void> {
    await this.updateAffiliateApplicationStatus(id, 'approved', reviewedBy, reviewNotes);
  }

  async rejectAffiliateApplication(id: number, reviewedBy: number, reviewNotes?: string): Promise<void> {
    await this.updateAffiliateApplicationStatus(id, 'rejected', reviewedBy, reviewNotes);
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
}

export const storage = new DatabaseStorage();