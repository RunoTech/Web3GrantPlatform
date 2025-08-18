import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const fees = sqliteTable("fees", {
  network: text("network").primaryKey(),
  tokenSymbol: text("token_symbol").notNull(),
  tokenAddress: text("token_address").notNull(),
  decimals: integer("decimals").notNull(),
  amount: integer("amount").notNull(), // Amount in smallest unit (wei, etc.)
});

export const accounts = sqliteTable("accounts", {
  wallet: text("wallet").primaryKey(),
  active: integer("active", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const campaigns = sqliteTable("campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("imageUrl").notNull(),
  ownerWallet: text("ownerWallet").notNull(),
  totalDonations: integer("totalDonations").default(0),
  donationCount: integer("donationCount").default(0),
  featured: integer("featured", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const dailyEntries = sqliteTable("daily_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wallet: text("wallet").notNull(),
  date: text("date").notNull(),
});

export const winners = sqliteTable("winners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wallet: text("wallet").notNull(),
  date: text("date").notNull(),
});

// Zod schemas
export const insertFeeSchema = createInsertSchema(fees);
export const insertAccountSchema = createInsertSchema(accounts).omit({ createdAt: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ 
  id: true, 
  totalDonations: true, 
  donationCount: true, 
  featured: true, 
  createdAt: true 
});
export const insertDailyEntrySchema = createInsertSchema(dailyEntries).omit({ id: true });
export const insertWinnerSchema = createInsertSchema(winners).omit({ id: true });

// Types
export type Fee = typeof fees.$inferSelect;
export type InsertFee = z.infer<typeof insertFeeSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type DailyEntry = typeof dailyEntries.$inferSelect;
export type InsertDailyEntry = z.infer<typeof insertDailyEntrySchema>;
export type Winner = typeof winners.$inferSelect;
export type InsertWinner = z.infer<typeof insertWinnerSchema>;
