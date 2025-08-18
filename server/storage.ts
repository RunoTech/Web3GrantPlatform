import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
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
} from "../shared/schema";

export interface IStorage {
  // Admin Management
  getAdmin(id: number): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdmin(id: number, updates: Partial<Admin>): Promise<void>;
  getAllAdmins(): Promise<Admin[]>;

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
  checkDailyEntry(wallet: string, date: string): Promise<boolean>;
  createDailyWinner(winner: InsertDailyWinner): Promise<DailyWinner>;
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
  getAdminLogs(adminId?: number, limit?: number): Promise<AdminLog[]>;

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

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db.insert(campaigns).values(campaign).returning();
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

  async getAdminLogs(adminId?: number, limit: number = 100): Promise<AdminLog[]> {
    let query = db.select().from(adminLogs);
    
    if (adminId) {
      query = query.where(eq(adminLogs.adminId, adminId)) as any;
    }
    
    return await query.orderBy(desc(adminLogs.createdAt)).limit(limit);
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
}

export const storage = new DatabaseStorage();