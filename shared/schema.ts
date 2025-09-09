import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Admin users table
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("admin"), // admin, super_admin
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Platform settings for admin control
export const platformSettings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // general, fees, rewards, footer, ui
  dataType: varchar("data_type", { length: 20 }).notNull().default("text"), // text, number, boolean, json
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: integer("updated_by").references(() => admins.id),
});

// Network fees management
export const networkFees = pgTable("network_fees", {
  id: serial("id").primaryKey(),
  network: varchar("network", { length: 20 }).notNull().default('ethereum'), // Only ethereum
  tokenSymbol: varchar("token_symbol", { length: 10 }).notNull().default('USDT'),
  tokenAddress: varchar("token_address", { length: 42 }).notNull().default("0xdAC17F958D2ee523a2206206994597C13D831ec7"),
  decimals: integer("decimals").notNull().default(6), // USDT has 6 decimals
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull().default("50"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: integer("updated_by").references(() => admins.id),
});

// User accounts
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  wallet: varchar("wallet", { length: 42 }).notNull().unique(),
  active: boolean("active").default(false),
  activationTxHash: varchar("activation_tx_hash", { length: 66 }),
  activationDate: timestamp("activation_date"),
  
  // Affiliate system fields
  referralCode: varchar("referral_code", { length: 20 }).unique(), // Unique referral code for this user
  referredBy: varchar("referred_by", { length: 42 }), // Wallet address of the user who referred this account
  affiliateActivated: boolean("affiliate_activated").default(false), // Whether affiliate benefits are activated
  affiliateActivationDate: timestamp("affiliate_activation_date"), // When affiliate system was activated for this user
  totalReferrals: integer("total_referrals").default(0), // Number of successful referrals
  totalAffiliateEarnings: decimal("total_affiliate_earnings", { precision: 18, scale: 8 }).default("0"), // Total earnings from affiliates
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign type and creator type enums
export const campaignTypeEnum = pgEnum("campaign_type", ["FUND", "DONATE"]);
export const creatorTypeEnum = pgEnum("creator_type", ["company", "citizen", "association", "foundation"]);

// Campaigns
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  imageUrl: varchar("image_url", { length: 500 }).notNull(),
  ownerWallet: varchar("owner_wallet", { length: 42 }).notNull(),
  campaignType: campaignTypeEnum("campaign_type").notNull().default("DONATE"), // FUND or DONATE
  creatorType: creatorTypeEnum("creator_type").notNull().default("citizen"), // company, citizen, association, foundation
  targetAmount: decimal("target_amount", { precision: 18, scale: 8 }).default("0"),
  totalDonations: decimal("total_donations", { precision: 18, scale: 8 }).default("0"),
  donationCount: integer("donation_count").default(0),
  
  // Company information fields (for FUND campaigns)
  companyName: varchar("company_name", { length: 200 }),
  companyRegistrationNumber: varchar("company_registration_number", { length: 100 }),
  companyAddress: text("company_address"),
  companyWebsite: varchar("company_website", { length: 300 }),
  companyEmail: varchar("company_email", { length: 100 }),
  companyPhone: varchar("company_phone", { length: 50 }),
  companyCEO: varchar("company_ceo", { length: 100 }),
  companyFoundedYear: integer("company_founded_year"),
  companyIndustry: varchar("company_industry", { length: 100 }),
  companyEmployeeCount: varchar("company_employee_count", { length: 50 }),
  
  // Time-limited fields (only for DONATE campaigns)
  startDate: timestamp("start_date"), // Required for DONATE, null for FUND
  endDate: timestamp("end_date"), // Required for DONATE, null for FUND
  featured: boolean("featured").default(false),
  active: boolean("active").default(true),
  approved: boolean("approved").default(false),
  approvedBy: integer("approved_by").references(() => admins.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign donations tracking
export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  donorWallet: varchar("donor_wallet", { length: 42 }).notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  txHash: varchar("tx_hash", { length: 66 }).notNull(),
  network: varchar("network", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily reward system
export const dailyEntries = pgTable("daily_entries", {
  id: serial("id").primaryKey(),
  wallet: varchar("wallet", { length: 42 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyWinners = pgTable("daily_winners", {
  id: serial("id").primaryKey(),
  wallet: varchar("wallet", { length: 42 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  txHash: varchar("tx_hash", { length: 66 }),
  selectedBy: integer("selected_by").references(() => admins.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Footer and content management
export const footerLinks = pgTable("footer_links", {
  id: serial("id").primaryKey(),
  section: varchar("section", { length: 50 }).notNull(), // platform, support, connection
  title: varchar("title", { length: 100 }).notNull(),
  url: varchar("url", { length: 200 }),
  order: integer("order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Platform announcements
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 20 }).notNull().default("info"), // info, warning, success, error
  active: boolean("active").default(true),
  showUntil: timestamp("show_until"),
  createdBy: integer("created_by").references(() => admins.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin activity logs
export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => admins.id),
  action: varchar("action", { length: 100 }).notNull(),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Affiliate tracking and rewards
export const affiliateActivities = pgTable("affiliate_activities", {
  id: serial("id").primaryKey(),
  referrerWallet: varchar("referrer_wallet", { length: 42 }).notNull(), // Who gets the reward
  referredWallet: varchar("referred_wallet", { length: 42 }).notNull(), // Who was referred
  activityType: varchar("activity_type", { length: 20 }).notNull(), // "donation", "campaign_creation"
  relatedId: integer("related_id"), // Campaign or donation ID
  rewardAmount: decimal("reward_amount", { precision: 18, scale: 8 }).default("0"), // Potential reward amount
  rewardPaid: boolean("reward_paid").default(false), // Whether reward has been paid
  txHash: varchar("tx_hash", { length: 66 }), // Transaction hash if reward was paid
  createdAt: timestamp("created_at").defaultNow(),
});

export const affiliateApplications = pgTable("affiliate_applications", {
  id: serial("id").primaryKey(),
  wallet: varchar("wallet", { length: 42 }).notNull().unique(), // Applicant wallet address
  applicationText: text("application_text").notNull(), // Application description/reason
  status: varchar("status", { length: 20 }).default("pending").notNull(), // "pending", "approved", "rejected"
  appliedAt: timestamp("applied_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by"), // Admin ID who reviewed
  reviewNotes: text("review_notes"), // Admin notes about the decision
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wallets table for tracking wallet information
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  address: varchar("address", { length: 42 }).notNull().unique(),
  ownerType: varchar("owner_type", { length: 20 }), // "account", "campaign", "admin", etc.
  ownerId: integer("owner_id"), // Reference to the owner entity
  createdAt: timestamp("created_at").defaultNow(),
});

// Transactions table for comprehensive transaction tracking
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  txHash: varchar("tx_hash", { length: 66 }).notNull().unique(),
  fromAddress: varchar("from_address", { length: 42 }).notNull(),
  toAddress: varchar("to_address", { length: 42 }).notNull(),
  token: varchar("token", { length: 10 }).notNull(), // USDT, ETH, etc.
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, confirmed, failed
  campaignId: integer("campaign_id").references(() => campaigns.id),
  blockNumber: integer("block_number"),
  gasUsed: varchar("gas_used"),
  gasPrice: varchar("gas_price"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily rewards comprehensive table (replacing dailyEntries/dailyWinners)
export const dailyRewards = pgTable("daily_rewards", {
  id: serial("id").primaryKey(),
  rewardDate: varchar("reward_date", { length: 10 }).notNull().unique(), // YYYY-MM-DD
  prizeAmountUsdt: decimal("prize_amount_usdt", { precision: 18, scale: 8 }).notNull().default("100"),
  winnerWallet: varchar("winner_wallet", { length: 42 }),
  isClosed: boolean("is_closed").default(false),
  selectedBy: integer("selected_by").references(() => admins.id),
  selectedAt: timestamp("selected_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily participants table
export const dailyParticipants = pgTable("daily_participants", {
  id: serial("id").primaryKey(),
  dailyRewardId: integer("daily_reward_id").notNull().references(() => dailyRewards.id),
  wallet: varchar("wallet", { length: 42 }).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Relations
export const platformSettingsRelations = relations(platformSettings, ({ one }) => ({
  updatedBy: one(admins, {
    fields: [platformSettings.updatedBy],
    references: [admins.id],
  }),
}));

export const networkFeesRelations = relations(networkFees, ({ one }) => ({
  updatedBy: one(admins, {
    fields: [networkFees.updatedBy],
    references: [admins.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  approvedBy: one(admins, {
    fields: [campaigns.approvedBy],
    references: [admins.id],
  }),
  donations: many(donations),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [donations.campaignId],
    references: [campaigns.id],
  }),
}));

export const dailyWinnersRelations = relations(dailyWinners, ({ one }) => ({
  selectedBy: one(admins, {
    fields: [dailyWinners.selectedBy],
    references: [admins.id],
  }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  createdBy: one(admins, {
    fields: [announcements.createdBy],
    references: [admins.id],
  }),
}));

export const adminLogsRelations = relations(adminLogs, ({ one }) => ({
  admin: one(admins, {
    fields: [adminLogs.adminId],
    references: [admins.id],
  }),
}));

export const affiliateActivitiesRelations = relations(affiliateActivities, ({ one }) => ({
  referrer: one(accounts, {
    fields: [affiliateActivities.referrerWallet],
    references: [accounts.wallet],
  }),
  referred: one(accounts, {
    fields: [affiliateActivities.referredWallet],
    references: [accounts.wallet],
  }),
}));

export const affiliateApplicationsRelations = relations(affiliateApplications, ({ one }) => ({
  applicant: one(accounts, {
    fields: [affiliateApplications.wallet],
    references: [accounts.wallet],
  }),
  reviewer: one(admins, {
    fields: [affiliateApplications.reviewedBy],
    references: [admins.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  // Add relations as needed based on ownerType
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [transactions.campaignId],
    references: [campaigns.id],
  }),
}));

export const dailyRewardsRelations = relations(dailyRewards, ({ one, many }) => ({
  selectedBy: one(admins, {
    fields: [dailyRewards.selectedBy],
    references: [admins.id],
  }),
  participants: many(dailyParticipants),
}));

export const dailyParticipantsRelations = relations(dailyParticipants, ({ one }) => ({
  dailyReward: one(dailyRewards, {
    fields: [dailyParticipants.dailyRewardId],
    references: [dailyRewards.id],
  }),
}));

// Zod schemas for validation
export const insertAdminSchema = createInsertSchema(admins).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertPlatformSettingSchema = createInsertSchema(platformSettings).omit({ 
  id: true, 
  updatedAt: true 
});

export const insertNetworkFeeSchema = createInsertSchema(networkFees).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertAccountSchema = createInsertSchema(accounts).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({ 
  id: true, 
  totalDonations: true, 
  donationCount: true, 
  featured: true,
  active: true,
  approved: true, 
  approvedBy: true, 
  approvedAt: true, 
  createdAt: true, 
  updatedAt: true 
}).extend({
  // Custom validation for campaign types
  campaignType: z.enum(["FUND", "DONATE"]),
  creatorType: z.enum(["company", "citizen", "association", "foundation"]),
  // Start and end dates are conditional based on campaign type
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const insertDonationSchema = createInsertSchema(donations).omit({ 
  id: true, 
  createdAt: true 
});

export const insertDailyEntrySchema = createInsertSchema(dailyEntries).omit({ 
  id: true, 
  createdAt: true 
});

export const insertDailyWinnerSchema = createInsertSchema(dailyWinners).omit({ 
  id: true, 
  createdAt: true 
});

export const insertFooterLinkSchema = createInsertSchema(footerLinks).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertAdminLogSchema = createInsertSchema(adminLogs).omit({ 
  id: true, 
  createdAt: true 
});

export const insertAffiliateActivitySchema = createInsertSchema(affiliateActivities).omit({ 
  id: true, 
  createdAt: true 
});

export const insertWalletSchema = createInsertSchema(wallets).omit({ 
  id: true, 
  createdAt: true 
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({ 
  id: true, 
  createdAt: true 
});

export const insertDailyRewardSchema = createInsertSchema(dailyRewards).omit({ 
  id: true, 
  createdAt: true 
});

export const insertDailyParticipantSchema = createInsertSchema(dailyParticipants).omit({ 
  id: true, 
  joinedAt: true 
});

export const insertAffiliateApplicationSchema = createInsertSchema(affiliateApplications).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Types
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type PlatformSetting = typeof platformSettings.$inferSelect;
export type InsertPlatformSetting = z.infer<typeof insertPlatformSettingSchema>;
export type NetworkFee = typeof networkFees.$inferSelect;
export type InsertNetworkFee = z.infer<typeof insertNetworkFeeSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type DailyEntry = typeof dailyEntries.$inferSelect;
export type InsertDailyEntry = z.infer<typeof insertDailyEntrySchema>;
export type DailyWinner = typeof dailyWinners.$inferSelect;
export type InsertDailyWinner = z.infer<typeof insertDailyWinnerSchema>;
export type FooterLink = typeof footerLinks.$inferSelect;
export type InsertFooterLink = z.infer<typeof insertFooterLinkSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
export type AffiliateActivity = typeof affiliateActivities.$inferSelect;
export type InsertAffiliateActivity = z.infer<typeof insertAffiliateActivitySchema>;
export type AffiliateApplication = typeof affiliateApplications.$inferSelect;
export type InsertAffiliateApplication = z.infer<typeof insertAffiliateApplicationSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type DailyReward = typeof dailyRewards.$inferSelect;
export type InsertDailyReward = z.infer<typeof insertDailyRewardSchema>;
export type DailyParticipant = typeof dailyParticipants.$inferSelect;
export type InsertDailyParticipant = z.infer<typeof insertDailyParticipantSchema>;