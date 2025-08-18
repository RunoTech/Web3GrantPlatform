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
  network: varchar("network", { length: 20 }).notNull(), // ethereum, bsc
  tokenSymbol: varchar("token_symbol", { length: 10 }).notNull(),
  tokenAddress: varchar("token_address", { length: 42 }).notNull(),
  decimals: integer("decimals").notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaigns
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  imageUrl: varchar("image_url", { length: 500 }).notNull(),
  ownerWallet: varchar("owner_wallet", { length: 42 }).notNull(),
  targetAmount: decimal("target_amount", { precision: 18, scale: 8 }).default("0"),
  totalDonations: decimal("total_donations", { precision: 18, scale: 8 }).default("0"),
  donationCount: integer("donation_count").default(0),
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
  approved: true, 
  approvedBy: true, 
  approvedAt: true, 
  createdAt: true, 
  updatedAt: true 
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