import { z } from "zod";

// Column type definitions
export type ColumnType = 
  | "text" 
  | "number" 
  | "boolean" 
  | "date" 
  | "datetime" 
  | "email" 
  | "wallet"
  | "txhash"
  | "json"
  | "decimal"
  | "enum"
  | "masked"; // For sensitive data like card numbers

// Column configuration
export interface ColumnConfig {
  key: string; // Database column name
  label: string; // Display name
  type: ColumnType;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  hidden?: boolean; // Hidden by default
  mask?: "card" | "session" | "cvv" | "full"; // Masking strategy
  enumValues?: string[]; // For enum types
}

// Table permissions
export interface TablePermissions {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  export: boolean;
}

// Table configuration
export interface TableConfig {
  name: string; // Database table name
  label: string; // Display name
  icon?: string; // Lucide icon name
  description?: string;
  permissions: TablePermissions;
  columns: ColumnConfig[];
  defaultSort?: { column: string; direction: "asc" | "desc" };
  rowsPerPage?: number;
  primaryKey?: string; // Default: "id"
  sensitiveTable?: boolean; // Requires extra confirmation for access
  auditAccess?: boolean; // Log all access to this table
}

// Admin table configurations
export const adminTableConfigs: Record<string, TableConfig> = {
  // High priority operational tables
  accounts: {
    name: "accounts",
    label: "User Accounts",
    icon: "Users",
    description: "Platform user accounts and wallet information",
    permissions: { read: true, create: false, update: true, delete: false, export: true },
    columns: [
      { key: "id", label: "ID", type: "number", sortable: true },
      { key: "wallet", label: "Wallet Address", type: "wallet", sortable: true, searchable: true },
      { key: "active", label: "Active", type: "boolean", sortable: true, filterable: true },
      { key: "activationTxHash", label: "Activation Tx", type: "txhash", sortable: false },
      { key: "activationDate", label: "Activated", type: "datetime", sortable: true },
      { key: "balanceAvailable", label: "Available Balance", type: "decimal", sortable: true },
      { key: "balanceReserved", label: "Reserved Balance", type: "decimal", sortable: true },
      { key: "lastLoginAt", label: "Last Login", type: "datetime", sortable: true },
      { key: "totalLogins", label: "Total Logins", type: "number", sortable: true },
      { key: "totalDailyEntries", label: "Daily Entries", type: "number", sortable: true },
      { key: "createdAt", label: "Created", type: "datetime", sortable: true },
    ],
    defaultSort: { column: "createdAt", direction: "desc" },
    rowsPerPage: 50,
  },

  pending_payments: {
    name: "pending_payments",
    label: "Pending Payments",
    icon: "Clock",
    description: "Payment verification queue for campaign creation",
    permissions: { read: true, create: false, update: true, delete: true, export: true },
    columns: [
      { key: "id", label: "ID", type: "number", sortable: true },
      { key: "ownerWallet", label: "Owner", type: "wallet", sortable: true, searchable: true },
      { key: "expectedAmount", label: "Amount", type: "decimal", sortable: true },
      { key: "chainId", label: "Chain ID", type: "number", sortable: true, filterable: true },
      { key: "platformWallet", label: "Platform Wallet", type: "wallet", sortable: false },
      { key: "tokenAddress", label: "Token", type: "wallet", sortable: false },
      { key: "txHash", label: "Transaction", type: "txhash", sortable: false, searchable: true },
      { key: "status", label: "Status", type: "enum", sortable: true, filterable: true, enumValues: ["pending", "confirmed", "failed"] },
      { key: "formData", label: "Form Data", type: "json", hidden: true },
      { key: "createdAt", label: "Created", type: "datetime", sortable: true },
      { key: "updatedAt", label: "Updated", type: "datetime", sortable: true },
    ],
    defaultSort: { column: "createdAt", direction: "desc" },
    rowsPerPage: 25,
  },

  corporate_verifications: {
    name: "corporate_verifications",
    label: "Corporate Verifications",
    icon: "Building",
    description: "KYB verification requests for FUND campaigns",
    permissions: { read: true, create: false, update: true, delete: false, export: true },
    columns: [
      { key: "id", label: "ID", type: "number", sortable: true },
      { key: "wallet", label: "Wallet", type: "wallet", sortable: true, searchable: true },
      { key: "companyName", label: "Company", type: "text", sortable: true, searchable: true },
      { key: "companyRegistrationNumber", label: "Reg. Number", type: "text", sortable: false },
      { key: "taxId", label: "Tax ID", type: "text", sortable: false },
      { key: "companyEmail", label: "Email", type: "email", sortable: false },
      { key: "companyPhone", label: "Phone", type: "text", sortable: false },
      { key: "contactPersonName", label: "Contact Person", type: "text", sortable: true },
      { key: "status", label: "Status", type: "enum", sortable: true, filterable: true, enumValues: ["pending", "reviewing", "approved", "rejected"] },
      { key: "verifiedBy", label: "Verified By", type: "number", sortable: false },
      { key: "verifiedAt", label: "Verified", type: "datetime", sortable: true },
      { key: "rejectionReason", label: "Rejection Reason", type: "text", hidden: true },
      { key: "adminNotes", label: "Admin Notes", type: "text", hidden: true },
      { key: "createdAt", label: "Created", type: "datetime", sortable: true },
    ],
    defaultSort: { column: "createdAt", direction: "desc" },
    rowsPerPage: 25,
  },

  payment_attempts: {
    name: "payment_attempts",
    label: "Payment Attempts",
    icon: "CreditCard",
    description: "Credit card payment attempts tracking",
    permissions: { read: true, create: false, update: false, delete: true, export: true },
    columns: [
      { key: "id", label: "ID", type: "number", sortable: true },
      { key: "campaignId", label: "Campaign", type: "number", sortable: true, filterable: true },
      { key: "initiatorWallet", label: "Initiator", type: "wallet", sortable: true, searchable: true },
      { key: "amount", label: "Amount", type: "decimal", sortable: true },
      { key: "currency", label: "Currency", type: "text", sortable: true, filterable: true },
      { key: "cardBrand", label: "Card Brand", type: "text", sortable: true, filterable: true },
      { key: "cardLast4", label: "Last 4", type: "text", sortable: false },
      { key: "status", label: "Status", type: "enum", sortable: true, filterable: true, enumValues: ["success", "failed", "pending"] },
      { key: "errorCode", label: "Error Code", type: "text", sortable: false },
      { key: "errorMessage", label: "Error Message", type: "text", hidden: true },
      { key: "processingTime", label: "Time (ms)", type: "number", sortable: true },
      { key: "ipAddress", label: "IP Address", type: "text", sortable: false },
      { key: "attemptedAt", label: "Attempted", type: "datetime", sortable: true },
    ],
    defaultSort: { column: "attemptedAt", direction: "desc" },
    rowsPerPage: 50,
  },

  balance_ledger: {
    name: "balance_ledger",
    label: "Balance Ledger",
    icon: "BookOpen",
    description: "Audit trail of all balance movements",
    permissions: { read: true, create: false, update: false, delete: false, export: true },
    columns: [
      { key: "id", label: "ID", type: "number", sortable: true },
      { key: "wallet", label: "Wallet", type: "wallet", sortable: true, searchable: true },
      { key: "type", label: "Type", type: "enum", sortable: true, filterable: true, enumValues: ["credit", "debit"] },
      { key: "amount", label: "Amount", type: "decimal", sortable: true },
      { key: "reason", label: "Reason", type: "text", sortable: true, filterable: true },
      { key: "refId", label: "Ref ID", type: "number", sortable: false },
      { key: "refType", label: "Ref Type", type: "text", sortable: true, filterable: true },
      { key: "balanceBefore", label: "Before", type: "decimal", sortable: false },
      { key: "balanceAfter", label: "After", type: "decimal", sortable: false },
      { key: "createdAt", label: "Created", type: "datetime", sortable: true },
    ],
    defaultSort: { column: "createdAt", direction: "desc" },
    rowsPerPage: 50,
  },

  failed_card_attempts: {
    name: "failed_card_attempts",
    label: "Failed Card Attempts",
    icon: "AlertTriangle",
    description: "Failed credit card payment attempts (DEVELOPMENT ONLY)",
    permissions: { read: true, create: false, update: false, delete: true, export: false },
    sensitiveTable: true,
    auditAccess: true,
    columns: [
      { key: "id", label: "ID", type: "number", sortable: true },
      { key: "wallet", label: "Wallet", type: "wallet", sortable: true, searchable: true },
      { key: "campaignId", label: "Campaign", type: "number", sortable: true, filterable: true },
      { key: "amount", label: "Amount", type: "decimal", sortable: true },
      { key: "purpose", label: "Purpose", type: "text", sortable: true, filterable: true },
      { key: "encodedCardData", label: "Card Data (Base64)", type: "masked", mask: "card", hidden: false },
      { key: "ipAddress", label: "IP Address", type: "text", sortable: false },
      { key: "errorMessage", label: "Error", type: "text", sortable: false },
      { key: "createdAt", label: "Created", type: "datetime", sortable: true },
    ],
    defaultSort: { column: "createdAt", direction: "desc" },
    rowsPerPage: 25,
  },

  // Additional operational tables
  payment_intents: {
    name: "payment_intents",
    label: "Payment Intents",
    icon: "DollarSign",
    description: "Unified payment intent tracking",
    permissions: { read: true, create: false, update: true, delete: false, export: true },
    columns: [
      { key: "id", label: "ID", type: "number", sortable: true },
      { key: "wallet", label: "Wallet", type: "wallet", sortable: true, searchable: true },
      { key: "purpose", label: "Purpose", type: "text", sortable: true, filterable: true },
      { key: "amount", label: "Amount", type: "decimal", sortable: true },
      { key: "method", label: "Method", type: "enum", sortable: true, filterable: true, enumValues: ["USDT", "STRIPE"] },
      { key: "status", label: "Status", type: "enum", sortable: true, filterable: true, enumValues: ["pending", "confirmed", "failed", "expired"] },
      { key: "txHash", label: "Tx Hash", type: "txhash", sortable: false },
      { key: "stripeSessionId", label: "Stripe Session", type: "text", hidden: true },
      { key: "metadata", label: "Metadata", type: "json", hidden: true },
      { key: "createdAt", label: "Created", type: "datetime", sortable: true },
      { key: "confirmedAt", label: "Confirmed", type: "datetime", sortable: true },
    ],
    defaultSort: { column: "createdAt", direction: "desc" },
    rowsPerPage: 50,
  },

  collateral_reservations: {
    name: "collateral_reservations",
    label: "Collateral Reservations",
    icon: "Lock",
    description: "Campaign collateral tracking",
    permissions: { read: true, create: false, update: true, delete: false, export: true },
    columns: [
      { key: "id", label: "ID", type: "number", sortable: true },
      { key: "campaignId", label: "Campaign", type: "number", sortable: true, filterable: true },
      { key: "wallet", label: "Wallet", type: "wallet", sortable: true, searchable: true },
      { key: "amount", label: "Amount", type: "decimal", sortable: true },
      { key: "status", label: "Status", type: "enum", sortable: true, filterable: true, enumValues: ["active", "released", "forfeited"] },
      { key: "createdAt", label: "Created", type: "datetime", sortable: true },
      { key: "releasedAt", label: "Released", type: "datetime", sortable: true },
      { key: "notes", label: "Notes", type: "text", hidden: true },
    ],
    defaultSort: { column: "createdAt", direction: "desc" },
    rowsPerPage: 25,
  },

  fund_documents: {
    name: "fund_documents",
    label: "FUND Documents",
    icon: "FileText",
    description: "KYB document uploads",
    permissions: { read: true, create: false, update: false, delete: true, export: false },
    columns: [
      { key: "id", label: "ID", type: "number", sortable: true },
      { key: "verificationId", label: "Verification", type: "number", sortable: true, filterable: true },
      { key: "documentType", label: "Type", type: "enum", sortable: true, filterable: true, enumValues: ["id_card", "passport", "company_registry", "tax_certificate", "bank_statement", "business_license", "authorization_letter", "other"] },
      { key: "fileName", label: "File Name", type: "text", sortable: true },
      { key: "fileUrl", label: "URL", type: "text", sortable: false },
      { key: "fileSize", label: "Size (bytes)", type: "number", sortable: true },
      { key: "mimeType", label: "MIME Type", type: "text", sortable: false },
      { key: "uploadedBy", label: "Uploaded By", type: "wallet", sortable: false },
      { key: "createdAt", label: "Uploaded", type: "datetime", sortable: true },
    ],
    defaultSort: { column: "createdAt", direction: "desc" },
    rowsPerPage: 25,
  },

  pending_funds: {
    name: "pending_funds",
    label: "Pending FUND Campaigns",
    icon: "Briefcase",
    description: "FUND campaigns awaiting verification/payment",
    permissions: { read: true, create: false, update: true, delete: true, export: true },
    columns: [
      { key: "id", label: "ID", type: "number", sortable: true },
      { key: "wallet", label: "Wallet", type: "wallet", sortable: true, searchable: true },
      { key: "campaignData", label: "Campaign Data", type: "json", hidden: true },
      { key: "verificationId", label: "Verification", type: "number", sortable: false },
      { key: "collateralAmount", label: "Collateral", type: "decimal", sortable: true },
      { key: "collateralPaid", label: "Paid", type: "boolean", sortable: true, filterable: true },
      { key: "collateralTxHash", label: "Tx Hash", type: "txhash", sortable: false },
      { key: "status", label: "Status", type: "enum", sortable: true, filterable: true, enumValues: ["draft", "awaiting_payment", "awaiting_verification", "ready_to_publish", "published", "rejected"] },
      { key: "publishedCampaignId", label: "Campaign ID", type: "number", sortable: false },
      { key: "errorMessage", label: "Error", type: "text", hidden: true },
      { key: "createdAt", label: "Created", type: "datetime", sortable: true },
    ],
    defaultSort: { column: "createdAt", direction: "desc" },
    rowsPerPage: 25,
  },

  // System tables
  user_sessions: {
    name: "user_sessions",
    label: "User Sessions",
    icon: "Key",
    description: "Active user sessions",
    permissions: { read: true, create: false, update: false, delete: true, export: false },
    sensitiveTable: true,
    columns: [
      { key: "id", label: "ID", type: "number", sortable: true },
      { key: "sessionId", label: "Session ID", type: "masked", mask: "session", sortable: false },
      { key: "wallet", label: "Wallet", type: "wallet", sortable: true, searchable: true },
      { key: "active", label: "Active", type: "boolean", sortable: true, filterable: true },
      { key: "ipAddress", label: "IP Address", type: "text", sortable: false },
      { key: "userAgent", label: "User Agent", type: "text", hidden: true },
      { key: "expiresAt", label: "Expires", type: "datetime", sortable: true },
      { key: "createdAt", label: "Created", type: "datetime", sortable: true },
      { key: "lastUsedAt", label: "Last Used", type: "datetime", sortable: true },
    ],
    defaultSort: { column: "lastUsedAt", direction: "desc" },
    rowsPerPage: 50,
  },

  user_nonces: {
    name: "user_nonces",
    label: "User Nonces",
    icon: "Hash",
    description: "Authentication nonces for SIWE",
    permissions: { read: true, create: false, update: false, delete: true, export: false },
    columns: [
      { key: "id", label: "ID", type: "number", sortable: true },
      { key: "wallet", label: "Wallet", type: "wallet", sortable: true, searchable: true },
      { key: "nonce", label: "Nonce", type: "masked", mask: "session", sortable: false },
      { key: "used", label: "Used", type: "boolean", sortable: true, filterable: true },
      { key: "expiresAt", label: "Expires", type: "datetime", sortable: true },
      { key: "createdAt", label: "Created", type: "datetime", sortable: true },
    ],
    defaultSort: { column: "createdAt", direction: "desc" },
    rowsPerPage: 50,
  },

  used_transactions: {
    name: "used_transactions",
    label: "Used Transactions",
    icon: "Check",
    description: "Transaction idempotency tracking",
    permissions: { read: true, create: false, update: false, delete: false, export: true },
    columns: [
      { key: "id", label: "ID", type: "number", sortable: true },
      { key: "txHash", label: "Tx Hash", type: "txhash", sortable: true, searchable: true },
      { key: "network", label: "Network", type: "text", sortable: true, filterable: true },
      { key: "purpose", label: "Purpose", type: "text", sortable: true, filterable: true },
      { key: "wallet", label: "Wallet", type: "wallet", sortable: true, searchable: true },
      { key: "amount", label: "Amount", type: "decimal", sortable: true },
      { key: "tokenAddress", label: "Token", type: "wallet", sortable: false },
      { key: "blockNumber", label: "Block", type: "number", sortable: true },
      { key: "processedAt", label: "Processed", type: "datetime", sortable: true },
      { key: "createdAt", label: "Created", type: "datetime", sortable: true },
    ],
    defaultSort: { column: "createdAt", direction: "desc" },
    rowsPerPage: 50,
  },

  daily_entries: {
    name: "daily_entries",
    label: "Daily Reward Entries",
    icon: "Trophy",
    description: "Daily reward participation records",
    permissions: { read: true, create: false, update: false, delete: true, export: true },
    columns: [
      { key: "id", label: "ID", type: "number", sortable: true },
      { key: "wallet", label: "Wallet", type: "wallet", sortable: true, searchable: true },
      { key: "date", label: "Date", type: "date", sortable: true, filterable: true },
      { key: "createdAt", label: "Created", type: "datetime", sortable: true },
    ],
    defaultSort: { column: "createdAt", direction: "desc" },
    rowsPerPage: 100,
  },

  daily_winners: {
    name: "daily_winners",
    label: "Daily Winners",
    icon: "Award",
    description: "Selected daily reward winners",
    permissions: { read: true, create: false, update: true, delete: false, export: true },
    columns: [
      { key: "id", label: "ID", type: "number", sortable: true },
      { key: "wallet", label: "Wallet", type: "wallet", sortable: true, searchable: true },
      { key: "date", label: "Date", type: "date", sortable: true, filterable: true },
      { key: "amount", label: "Amount", type: "decimal", sortable: true },
      { key: "txHash", label: "Tx Hash", type: "txhash", sortable: false },
      { key: "selectedBy", label: "Selected By", type: "number", sortable: false },
      { key: "createdAt", label: "Created", type: "datetime", sortable: true },
    ],
    defaultSort: { column: "createdAt", direction: "desc" },
    rowsPerPage: 50,
  },

  daily_rewards: {
    name: "daily_rewards",
    label: "Daily Rewards",
    icon: "Gift",
    description: "Daily reward configuration",
    permissions: { read: true, create: false, update: true, delete: false, export: true },
    columns: [
      { key: "id", label: "ID", type: "number", sortable: true },
      { key: "rewardDate", label: "Date", type: "date", sortable: true, filterable: true },
      { key: "prizeAmountUsdt", label: "Prize (USDT)", type: "decimal", sortable: true },
      { key: "winnerWallet", label: "Winner", type: "wallet", sortable: false },
      { key: "isClosed", label: "Closed", type: "boolean", sortable: true, filterable: true },
      { key: "selectedBy", label: "Selected By", type: "number", sortable: false },
      { key: "selectedAt", label: "Selected", type: "datetime", sortable: true },
      { key: "createdAt", label: "Created", type: "datetime", sortable: true },
    ],
    defaultSort: { column: "rewardDate", direction: "desc" },
    rowsPerPage: 25,
  },

  daily_participants: {
    name: "daily_participants",
    label: "Daily Participants",
    icon: "Users",
    description: "Daily reward participants",
    permissions: { read: true, create: false, update: false, delete: false, export: true },
    columns: [
      { key: "id", label: "ID", type: "number", sortable: true },
      { key: "dailyRewardId", label: "Reward ID", type: "number", sortable: true, filterable: true },
      { key: "wallet", label: "Wallet", type: "wallet", sortable: true, searchable: true },
      { key: "joinedAt", label: "Joined", type: "datetime", sortable: true },
    ],
    defaultSort: { column: "joinedAt", direction: "desc" },
    rowsPerPage: 100,
  },
};

// Helper function to get table config
export function getTableConfig(tableName: string): TableConfig | null {
  return adminTableConfigs[tableName] || null;
}

// Helper function to get all table names
export function getAllTableNames(): string[] {
  return Object.keys(adminTableConfigs);
}

// Helper function to check if table is accessible
export function isTableAccessible(tableName: string): boolean {
  return tableName in adminTableConfigs;
}
