CREATE TYPE "public"."campaign_type" AS ENUM('FUND', 'DONATE');--> statement-breakpoint
CREATE TYPE "public"."creator_type" AS ENUM('company', 'citizen', 'association', 'foundation');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet" varchar(42) NOT NULL,
	"active" boolean DEFAULT false,
	"activation_tx_hash" varchar(66),
	"activation_date" timestamp,
	"referral_code" varchar(20),
	"referred_by" varchar(42),
	"affiliate_activated" boolean DEFAULT false,
	"affiliate_activation_date" timestamp,
	"total_referrals" integer DEFAULT 0,
	"total_affiliate_earnings" numeric(18, 8) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "accounts_wallet_unique" UNIQUE("wallet"),
	CONSTRAINT "accounts_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "admin_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"action" varchar(100) NOT NULL,
	"details" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'admin' NOT NULL,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admins_username_unique" UNIQUE("username"),
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "affiliate_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_wallet" varchar(42) NOT NULL,
	"referred_wallet" varchar(42) NOT NULL,
	"activity_type" varchar(20) NOT NULL,
	"related_id" integer,
	"reward_amount" numeric(18, 8) DEFAULT '0',
	"reward_paid" boolean DEFAULT false,
	"tx_hash" varchar(66),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "affiliate_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet" varchar(42) NOT NULL,
	"application_text" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"applied_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"reviewed_by" integer,
	"review_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "affiliate_applications_wallet_unique" UNIQUE("wallet")
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"type" varchar(20) DEFAULT 'info' NOT NULL,
	"active" boolean DEFAULT true,
	"show_until" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"image_url" varchar(500) NOT NULL,
	"owner_wallet" varchar(42) NOT NULL,
	"campaign_type" "campaign_type" DEFAULT 'DONATE' NOT NULL,
	"creator_type" "creator_type" DEFAULT 'citizen' NOT NULL,
	"target_amount" numeric(18, 8) DEFAULT '0',
	"total_donations" numeric(18, 8) DEFAULT '0',
	"donation_count" integer DEFAULT 0,
	"company_name" varchar(200),
	"company_registration_number" varchar(100),
	"company_address" text,
	"company_website" varchar(300),
	"company_email" varchar(100),
	"company_phone" varchar(50),
	"company_ceo" varchar(100),
	"company_founded_year" integer,
	"company_industry" varchar(100),
	"company_employee_count" varchar(50),
	"start_date" timestamp,
	"end_date" timestamp,
	"credit_card_enabled" boolean DEFAULT false,
	"collateral_amount" numeric(18, 8) DEFAULT '0',
	"collateral_tx_hash" varchar(66),
	"collateral_paid" boolean DEFAULT false,
	"stripe_account_id" varchar(100),
	"featured" boolean DEFAULT false,
	"active" boolean DEFAULT true,
	"approved" boolean DEFAULT false,
	"approved_by" integer,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet" varchar(42) NOT NULL,
	"date" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"daily_reward_id" integer NOT NULL,
	"wallet" varchar(42) NOT NULL,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"reward_date" varchar(10) NOT NULL,
	"prize_amount_usdt" numeric(18, 8) DEFAULT '100' NOT NULL,
	"winner_wallet" varchar(42),
	"is_closed" boolean DEFAULT false,
	"selected_by" integer,
	"selected_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "daily_rewards_reward_date_unique" UNIQUE("reward_date")
);
--> statement-breakpoint
CREATE TABLE "daily_winners" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet" varchar(42) NOT NULL,
	"date" varchar(10) NOT NULL,
	"amount" numeric(18, 8) NOT NULL,
	"tx_hash" varchar(66),
	"selected_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"donor_wallet" varchar(42) NOT NULL,
	"amount" numeric(18, 8) NOT NULL,
	"tx_hash" varchar(66) NOT NULL,
	"network" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "footer_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"section" varchar(50) NOT NULL,
	"title" varchar(100) NOT NULL,
	"url" varchar(200),
	"order" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "network_fees" (
	"id" serial PRIMARY KEY NOT NULL,
	"network" varchar(20) DEFAULT 'ethereum' NOT NULL,
	"token_symbol" varchar(10) DEFAULT 'USDT' NOT NULL,
	"token_address" varchar(42) DEFAULT '0xdAC17F958D2ee523a2206206994597C13D831ec7' NOT NULL,
	"decimals" integer DEFAULT 6 NOT NULL,
	"amount" numeric(18, 8) DEFAULT '50' NOT NULL,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"category" varchar(50) NOT NULL,
	"data_type" varchar(20) DEFAULT 'text' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" integer,
	CONSTRAINT "platform_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tx_hash" varchar(66) NOT NULL,
	"from_address" varchar(42) NOT NULL,
	"to_address" varchar(42) NOT NULL,
	"token" varchar(10) NOT NULL,
	"amount" numeric(18, 8) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"campaign_id" integer,
	"block_number" integer,
	"gas_used" varchar,
	"gas_price" varchar,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "transactions_tx_hash_unique" UNIQUE("tx_hash")
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"address" varchar(42) NOT NULL,
	"owner_type" varchar(20),
	"owner_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "wallets_address_unique" UNIQUE("address")
);
--> statement-breakpoint
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_approved_by_admins_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_participants" ADD CONSTRAINT "daily_participants_daily_reward_id_daily_rewards_id_fk" FOREIGN KEY ("daily_reward_id") REFERENCES "public"."daily_rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_rewards" ADD CONSTRAINT "daily_rewards_selected_by_admins_id_fk" FOREIGN KEY ("selected_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_winners" ADD CONSTRAINT "daily_winners_selected_by_admins_id_fk" FOREIGN KEY ("selected_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "network_fees" ADD CONSTRAINT "network_fees_updated_by_admins_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_admins_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");