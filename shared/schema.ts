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
  uniqueIndex,
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
  tokenAddress: varchar("token_address", { length: 42 }).notNull(),
  decimals: integer("decimals").notNull().default(6), // USDT has 6 decimals
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: integer("updated_by").references(() => admins.id),
});

// User authentication nonces - for SIWE (Sign-In With Ethereum)
export const userNonces = pgTable("user_nonces", {
  id: serial("id").primaryKey(),
  wallet: varchar("wallet", { length: 42 }).notNull(),
  nonce: varchar("nonce", { length: 64 }).notNull().unique(), // Random nonce for signature
  used: boolean("used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_user_nonces_wallet").on(table.wallet),
  index("idx_user_nonces_nonce").on(table.nonce),
  index("idx_user_nonces_expires").on(table.expiresAt),
]);

// User sessions - JWT alternative for authenticated users
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 128 }).notNull().unique(),
  wallet: varchar("wallet", { length: 42 }).notNull(),
  active: boolean("active").default(true),
  ipAddress: varchar("ip_address", { length: 45 }), // Support IPv6
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
}, (table) => [
  index("idx_user_sessions_wallet").on(table.wallet),
  index("idx_user_sessions_session_id").on(table.sessionId),
  index("idx_user_sessions_expires").on(table.expiresAt),
]);

// Used transactions tracking for payment idempotency
export const usedTransactions = pgTable("used_transactions", {
  id: serial("id").primaryKey(),
  txHash: varchar("tx_hash", { length: 66 }).notNull().unique(), // Ethereum transaction hash
  network: varchar("network", { length: 20 }).notNull().default('ethereum'), // Should always be ethereum
  purpose: varchar("purpose", { length: 50 }).notNull(), // 'account_activation', 'campaign_collateral'
  wallet: varchar("wallet", { length: 42 }).notNull(), // Wallet that used this transaction
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(), // Amount processed
  tokenAddress: varchar("token_address", { length: 42 }), // Token contract address used
  blockNumber: integer("block_number"), // Block number for confirmation tracking
  processedAt: timestamp("processed_at").defaultNow(), // When transaction was processed
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_used_transactions_hash").on(table.txHash),
  index("idx_used_transactions_wallet").on(table.wallet),
  index("idx_used_transactions_purpose").on(table.purpose),
  index("idx_used_transactions_processed").on(table.processedAt),
]);

// User accounts
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  wallet: varchar("wallet", { length: 42 }).notNull().unique(),
  active: boolean("active").default(false),
  activationTxHash: varchar("activation_tx_hash", { length: 66 }),
  activationDate: timestamp("activation_date"),
  
  // User activity tracking
  lastLoginAt: timestamp("last_login_at"), // Last wallet connection time
  totalLogins: integer("total_logins").default(0), // Total login count
  lastDailyEntryDate: varchar("last_daily_entry_date", { length: 10 }), // Last daily reward entry date (YYYY-MM-DD)
  totalDailyEntries: integer("total_daily_entries").default(0), // Total daily entries count
  
  // Company balance system for unified payments
  balanceAvailable: decimal("balance_available", { precision: 18, scale: 8 }).default("0"), // Available balance for collateral reservations
  balanceReserved: decimal("balance_reserved", { precision: 18, scale: 8 }).default("0"), // Reserved balance for active campaigns
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pending payments tracking for automatic campaign creation
export const pendingPayments = pgTable("pending_payments", {
  id: serial("id").primaryKey(),
  ownerWallet: varchar("owner_wallet", { length: 42 }).notNull(),
  expectedAmount: decimal("expected_amount", { precision: 18, scale: 8 }).notNull(),
  chainId: integer("chain_id").notNull().default(1), // Ethereum mainnet
  platformWallet: varchar("platform_wallet", { length: 42 }).notNull(),
  tokenAddress: varchar("token_address", { length: 42 }).notNull().default('0xdAC17F958D2ee523a2206206994597C13D831ec7'), // USDT
  txHash: varchar("tx_hash", { length: 66 }), // nullable until transaction is sent
  status: varchar("status", { length: 20 }).notNull().default('pending'), // pending, confirmed, failed
  formData: jsonb("form_data").notNull(), // Campaign form data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_pending_payments_owner").on(table.ownerWallet),
  index("idx_pending_payments_tx_hash").on(table.txHash),
  index("idx_pending_payments_status").on(table.status),
  index("idx_pending_payments_created").on(table.createdAt),
  uniqueIndex("idx_pending_payments_tx_hash_unique").on(table.txHash), // Prevent duplicate processing
]);

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
  
  // Credit card payment system
  creditCardEnabled: boolean("credit_card_enabled").default(false), // Whether campaign accepts credit card payments
  collateralAmount: decimal("collateral_amount", { precision: 18, scale: 8 }).default("0"), // Required collateral amount in USDT
  collateralTxHash: varchar("collateral_tx_hash", { length: 66 }), // Transaction hash of collateral payment
  collateralPaid: boolean("collateral_paid").default(false), // Whether collateral has been paid
  stripeAccountId: varchar("stripe_account_id", { length: 100 }), // Stripe Connect account for receiving payments
  
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
}, (table) => [
  index("idx_donations_campaign_id").on(table.campaignId),
]);

// Daily reward system
export const dailyEntries = pgTable("daily_entries", {
  id: serial("id").primaryKey(),
  wallet: varchar("wallet", { length: 42 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Prevent duplicate entries per wallet per day
  uniqueWalletDate: uniqueIndex("unique_wallet_date").on(table.wallet, table.date),
}));

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
  network: varchar("network", { length: 20 }).notNull().default("ethereum"), // ethereum, bsc
  token: varchar("token", { length: 10 }).notNull(), // USDT, ETH, etc.
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, confirmed, failed
  campaignId: integer("campaign_id").references(() => campaigns.id),
  blockNumber: integer("block_number"),
  gasUsed: varchar("gas_used"),
  gasPrice: varchar("gas_price"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_transactions_network").on(table.network),
  index("idx_transactions_campaign_id").on(table.campaignId),
]);

// Credit card payment attempts (for tracking failed payments)
export const paymentAttempts = pgTable("payment_attempts", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  initiatorWallet: varchar("initiator_wallet", { length: 42 }).notNull(), // Who tried to make the payment
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(), // Payment amount
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  
  // Card information (anonymized for security)
  cardBrand: varchar("card_brand", { length: 20 }), // visa, mastercard, etc.
  cardLast4: varchar("card_last4", { length: 4 }), // Last 4 digits
  
  // Payment processing details
  status: varchar("status", { length: 20 }).notNull(), // "success", "failed", "pending"
  errorCode: varchar("error_code", { length: 50 }), // "insufficient_funds", "card_declined", etc.
  errorMessage: text("error_message"), // Detailed error message
  
  // Processing metadata
  processingTime: integer("processing_time"), // Time taken in milliseconds
  attemptedAt: timestamp("attempted_at").defaultNow(),
  
  // Tracking fields
  ipAddress: varchar("ip_address", { length: 45 }), // For fraud prevention
  userAgent: text("user_agent"), // Browser/device info
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

// Collateral reservations for credit card enabled campaigns
export const collateralReservations = pgTable("collateral_reservations", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  wallet: varchar("wallet", { length: 42 }).notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, released, forfeited
  createdAt: timestamp("created_at").defaultNow(),
  releasedAt: timestamp("released_at"),
  notes: text("notes"), // For admin tracking
}, (table) => [
  index("idx_collateral_reservations_campaign").on(table.campaignId),
  index("idx_collateral_reservations_wallet").on(table.wallet),
  index("idx_collateral_reservations_status").on(table.status),
]);

// Payment intents for unified payment tracking
export const paymentIntents = pgTable("payment_intents", {
  id: serial("id").primaryKey(),
  wallet: varchar("wallet", { length: 42 }).notNull(),
  purpose: varchar("purpose", { length: 30 }).notNull(), // KYB_DEPOSIT, BALANCE_TOPUP, COLLATERAL_RESERVE
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  method: varchar("method", { length: 20 }).notNull(), // USDT, STRIPE
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, confirmed, failed, expired
  
  // Payment method specific data
  txHash: varchar("tx_hash", { length: 66 }), // For USDT payments
  stripeSessionId: varchar("stripe_session_id", { length: 100 }), // For Stripe payments
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 100 }), // Stripe payment intent ID
  
  // Metadata
  metadata: jsonb("metadata"), // Flexible data storage for campaign IDs, etc.
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  expiresAt: timestamp("expires_at"), // Payment expiry time
}, (table) => [
  index("idx_payment_intents_wallet").on(table.wallet),
  index("idx_payment_intents_purpose").on(table.purpose),
  index("idx_payment_intents_status").on(table.status),
  index("idx_payment_intents_tx_hash").on(table.txHash),
]);

// Balance ledger for audit trail of all balance movements
export const balanceLedger = pgTable("balance_ledger", {
  id: serial("id").primaryKey(),
  wallet: varchar("wallet", { length: 42 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // credit, debit
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  reason: varchar("reason", { length: 100 }).notNull(), // KYB_DEPOSIT, COLLATERAL_RESERVE, COLLATERAL_RELEASE, BALANCE_TOPUP, etc.
  refId: integer("ref_id"), // Reference to related record (payment_intent_id, collateral_reservation_id, etc.)
  refType: varchar("ref_type", { length: 30 }), // payment_intent, collateral_reservation, etc.
  balanceBefore: decimal("balance_before", { precision: 18, scale: 8 }).notNull(), // Balance before this transaction
  balanceAfter: decimal("balance_after", { precision: 18, scale: 8 }).notNull(), // Balance after this transaction
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_balance_ledger_wallet").on(table.wallet),
  index("idx_balance_ledger_type").on(table.type),
  index("idx_balance_ledger_reason").on(table.reason),
  index("idx_balance_ledger_created").on(table.createdAt),
]);

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

export const collateralReservationsRelations = relations(collateralReservations, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [collateralReservations.campaignId],
    references: [campaigns.id],
  }),
}));

export const paymentIntentsRelations = relations(paymentIntents, ({ one }) => ({
  // Relations can be added as needed based on usage
}));

export const balanceLedgerRelations = relations(balanceLedger, ({ one }) => ({
  // Relations can be added as needed based on usage
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
}).extend({
  url: z.string().refine((url) => {
    // Allow internal routes or valid HTTP/HTTPS URLs only
    return url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://');
  }, {
    message: "URL must be an internal route starting with '/' or a valid HTTP/HTTPS URL"
  })
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


export const insertPaymentAttemptSchema = createInsertSchema(paymentAttempts).omit({
  id: true,
  attemptedAt: true,
});

export const insertUserNonceSchema = createInsertSchema(userNonces).omit({
  id: true,
  createdAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

export const insertUsedTransactionSchema = createInsertSchema(usedTransactions).omit({
  id: true,
  processedAt: true,
  createdAt: true,
});

export const insertPendingPaymentSchema = createInsertSchema(pendingPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCollateralReservationSchema = createInsertSchema(collateralReservations).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentIntentSchema = createInsertSchema(paymentIntents).omit({
  id: true,
  createdAt: true,
});

export const insertBalanceLedgerSchema = createInsertSchema(balanceLedger).omit({
  id: true,
  createdAt: true,
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
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type DailyReward = typeof dailyRewards.$inferSelect;
export type InsertDailyReward = z.infer<typeof insertDailyRewardSchema>;
export type DailyParticipant = typeof dailyParticipants.$inferSelect;
export type InsertDailyParticipant = z.infer<typeof insertDailyParticipantSchema>;
export type CollateralReservation = typeof collateralReservations.$inferSelect;
export type InsertCollateralReservation = z.infer<typeof insertCollateralReservationSchema>;
export type PaymentIntent = typeof paymentIntents.$inferSelect;
export type InsertPaymentIntent = z.infer<typeof insertPaymentIntentSchema>;
export type BalanceLedger = typeof balanceLedger.$inferSelect;
export type InsertBalanceLedger = z.infer<typeof insertBalanceLedgerSchema>;
export type PaymentAttempt = typeof paymentAttempts.$inferSelect;
export type InsertPaymentAttempt = z.infer<typeof insertPaymentAttemptSchema>;
export type UserNonce = typeof userNonces.$inferSelect;
export type InsertUserNonce = z.infer<typeof insertUserNonceSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UsedTransaction = typeof usedTransactions.$inferSelect;
export type InsertUsedTransaction = z.infer<typeof insertUsedTransactionSchema>;
export type PendingPayment = typeof pendingPayments.$inferSelect;
export type InsertPendingPayment = z.infer<typeof insertPendingPaymentSchema>;

// ===== FUND SPECIFIC TABLES FOR KYB & VERIFICATION =====

// Verification status enum
export const verificationStatusEnum = pgEnum("verification_status", ["pending", "reviewing", "approved", "rejected"]);

// Document type enum for KYB uploads
export const documentTypeEnum = pgEnum("document_type", [
  "id_card", 
  "passport", 
  "company_registry", 
  "tax_certificate", 
  "bank_statement", 
  "business_license",
  "authorization_letter",
  "other"
]);

// Corporate verification tracking for FUND campaigns
export const corporateVerifications = pgTable("corporate_verifications", {
  id: serial("id").primaryKey(),
  wallet: varchar("wallet", { length: 42 }).notNull(),
  
  // Company details for verification
  companyName: varchar("company_name", { length: 200 }).notNull(),
  companyRegistrationNumber: varchar("company_registration_number", { length: 100 }),
  taxId: varchar("tax_id", { length: 50 }),
  companyAddress: text("company_address"),
  companyWebsite: varchar("company_website", { length: 300 }),
  companyEmail: varchar("company_email", { length: 100 }),
  companyPhone: varchar("company_phone", { length: 50 }),
  contactPersonName: varchar("contact_person_name", { length: 100 }).notNull(),
  contactPersonTitle: varchar("contact_person_title", { length: 100 }),
  
  // Verification status
  status: verificationStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  verifiedBy: integer("verified_by").references(() => admins.id),
  verifiedAt: timestamp("verified_at"),
  
  // Notes for admin review
  adminNotes: text("admin_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_corporate_verifications_wallet").on(table.wallet),
  index("idx_corporate_verifications_status").on(table.status),
  uniqueIndex("idx_corporate_verifications_wallet_unique").on(table.wallet), // One verification per wallet
]);

// Document uploads for KYB process
export const fundDocuments = pgTable("fund_documents", {
  id: serial("id").primaryKey(),
  verificationId: integer("verification_id").notNull().references(() => corporateVerifications.id),
  
  // Document details
  documentType: documentTypeEnum("document_type").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(), // File storage URL
  fileSize: integer("file_size"), // File size in bytes
  mimeType: varchar("mime_type", { length: 100 }),
  
  // Upload info
  uploadedBy: varchar("uploaded_by", { length: 42 }).notNull(), // Wallet address
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_fund_documents_verification_id").on(table.verificationId),
  index("idx_fund_documents_type").on(table.documentType),
]);

// Pending FUND campaigns waiting for verification and payment
export const pendingFunds = pgTable("pending_funds", {
  id: serial("id").primaryKey(),
  wallet: varchar("wallet", { length: 42 }).notNull(),
  
  // Campaign data (JSON format for flexibility)
  campaignData: jsonb("campaign_data").notNull(), // Stores all campaign form fields
  
  // Verification linkage
  verificationId: integer("verification_id").references(() => corporateVerifications.id),
  
  // Payment tracking
  collateralAmount: decimal("collateral_amount", { precision: 18, scale: 8 }).notNull(),
  collateralPaid: boolean("collateral_paid").default(false),
  collateralTxHash: varchar("collateral_tx_hash", { length: 66 }),
  
  // Status tracking
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, awaiting_payment, awaiting_verification, ready_to_publish, published, rejected
  publishedCampaignId: integer("published_campaign_id").references(() => campaigns.id),
  
  // Error handling
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_pending_funds_wallet").on(table.wallet),
  index("idx_pending_funds_status").on(table.status),
  index("idx_pending_funds_verification_id").on(table.verificationId),
]);

// Insert schemas for new tables
export const insertCorporateVerificationSchema = createInsertSchema(corporateVerifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFundDocumentSchema = createInsertSchema(fundDocuments).omit({
  id: true,
  createdAt: true,
});

export const insertPendingFundSchema = createInsertSchema(pendingFunds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for new tables
export type CorporateVerification = typeof corporateVerifications.$inferSelect;
export type InsertCorporateVerification = z.infer<typeof insertCorporateVerificationSchema>;
export type FundDocument = typeof fundDocuments.$inferSelect;
export type InsertFundDocument = z.infer<typeof insertFundDocumentSchema>;
export type PendingFund = typeof pendingFunds.$inferSelect;
export type InsertPendingFund = z.infer<typeof insertPendingFundSchema>;