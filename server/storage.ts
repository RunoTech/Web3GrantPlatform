import Database from "better-sqlite3";
import { 
  type Fee, type InsertFee,
  type Account, type InsertAccount,
  type Campaign, type InsertCampaign,
  type DailyEntry, type InsertDailyEntry,
  type Winner, type InsertWinner,
  fees, accounts, campaigns, dailyEntries, winners
} from "@shared/schema";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface IStorage {
  // Fees
  getFees(): Promise<Fee[]>;
  updateFee(fee: InsertFee): Promise<void>;
  
  // Accounts
  getAccount(wallet: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(wallet: string, updates: Partial<Account>): Promise<void>;
  
  // Campaigns
  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, updates: Partial<Campaign>): Promise<void>;
  getPopularCampaigns(limit: number): Promise<Campaign[]>;
  
  // Daily Entries
  createDailyEntry(entry: InsertDailyEntry): Promise<DailyEntry>;
  getDailyEntries(date: string): Promise<DailyEntry[]>;
  checkDailyEntry(wallet: string, date: string): Promise<boolean>;
  
  // Winners
  createWinner(winner: InsertWinner): Promise<Winner>;
  getWinners(limit?: number): Promise<Winner[]>;
  getWinnersByDate(date: string): Promise<Winner[]>;
}

export class SQLiteStorage implements IStorage {
  private db: Database.Database;

  constructor() {
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'database.sqlite');
    this.db = new Database(dbPath);
    this.initDatabase();
  }

  private initDatabase() {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS fees (
        network TEXT PRIMARY KEY,
        token_symbol TEXT NOT NULL,
        token_address TEXT NOT NULL,
        decimals INTEGER NOT NULL,
        amount INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS accounts (
        wallet TEXT PRIMARY KEY,
        active INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        imageUrl TEXT NOT NULL,
        ownerWallet TEXT NOT NULL,
        totalDonations INTEGER DEFAULT 0,
        donationCount INTEGER DEFAULT 0,
        featured INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS daily_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet TEXT NOT NULL,
        date TEXT NOT NULL,
        UNIQUE(wallet, date)
      );
      
      CREATE TABLE IF NOT EXISTS winners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet TEXT NOT NULL,
        date TEXT NOT NULL
      );
    `);

    // Seed default fees
    const ethFeeExists = this.db.prepare('SELECT 1 FROM fees WHERE network = ?').get('ethereum');
    const bscFeeExists = this.db.prepare('SELECT 1 FROM fees WHERE network = ?').get('bsc');
    
    if (!ethFeeExists) {
      this.db.prepare(`
        INSERT INTO fees (network, token_symbol, token_address, decimals, amount)
        VALUES (?, ?, ?, ?, ?)
      `).run('ethereum', 'USDT', '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 50000000);
    }
    
    if (!bscFeeExists) {
      this.db.prepare(`
        INSERT INTO fees (network, token_symbol, token_address, decimals, amount)
        VALUES (?, ?, ?, ?, ?)
      `).run('bsc', 'BUSD', '0xe9e7cea3dedca5984780bafc599bd69add087d56', 18, '25000000000000000000');
    }
  }

  async getFees(): Promise<Fee[]> {
    return this.db.prepare('SELECT * FROM fees').all() as Fee[];
  }

  async updateFee(fee: InsertFee): Promise<void> {
    this.db.prepare(`
      INSERT OR REPLACE INTO fees (network, token_symbol, token_address, decimals, amount)
      VALUES (?, ?, ?, ?, ?)
    `).run(fee.network, fee.tokenSymbol, fee.tokenAddress, fee.decimals, fee.amount);
  }

  async getAccount(wallet: string): Promise<Account | undefined> {
    return this.db.prepare('SELECT * FROM accounts WHERE wallet = ?').get(wallet) as Account | undefined;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    this.db.prepare(`
      INSERT INTO accounts (wallet, active)
      VALUES (?, ?)
    `).run(account.wallet, account.active ? 1 : 0);
    return this.getAccount(account.wallet) as Promise<Account>;
  }

  async updateAccount(wallet: string, updates: Partial<Account>): Promise<void> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    this.db.prepare(`UPDATE accounts SET ${fields} WHERE wallet = ?`).run(...values, wallet);
  }

  async getCampaigns(): Promise<Campaign[]> {
    return this.db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all() as Campaign[];
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id) as Campaign | undefined;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const result = this.db.prepare(`
      INSERT INTO campaigns (title, description, imageUrl, ownerWallet)
      VALUES (?, ?, ?, ?)
    `).run(campaign.title, campaign.description, campaign.imageUrl, campaign.ownerWallet);
    
    return this.getCampaign(result.lastInsertRowid as number) as Promise<Campaign>;
  }

  async updateCampaign(id: number, updates: Partial<Campaign>): Promise<void> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    this.db.prepare(`UPDATE campaigns SET ${fields} WHERE id = ?`).run(...values, id);
  }

  async getPopularCampaigns(limit: number): Promise<Campaign[]> {
    return this.db.prepare(`
      SELECT * FROM campaigns 
      ORDER BY totalDonations DESC, donationCount DESC 
      LIMIT ?
    `).all(limit) as Campaign[];
  }

  async createDailyEntry(entry: InsertDailyEntry): Promise<DailyEntry> {
    const result = this.db.prepare(`
      INSERT INTO daily_entries (wallet, date)
      VALUES (?, ?)
    `).run(entry.wallet, entry.date);
    
    return this.db.prepare('SELECT * FROM daily_entries WHERE id = ?').get(result.lastInsertRowid) as DailyEntry;
  }

  async getDailyEntries(date: string): Promise<DailyEntry[]> {
    return this.db.prepare('SELECT * FROM daily_entries WHERE date = ?').all(date) as DailyEntry[];
  }

  async checkDailyEntry(wallet: string, date: string): Promise<boolean> {
    const entry = this.db.prepare('SELECT 1 FROM daily_entries WHERE wallet = ? AND date = ?').get(wallet, date);
    return !!entry;
  }

  async createWinner(winner: InsertWinner): Promise<Winner> {
    const result = this.db.prepare(`
      INSERT INTO winners (wallet, date)
      VALUES (?, ?)
    `).run(winner.wallet, winner.date);
    
    return this.db.prepare('SELECT * FROM winners WHERE id = ?').get(result.lastInsertRowid) as Winner;
  }

  async getWinners(limit: number = 10): Promise<Winner[]> {
    return this.db.prepare('SELECT * FROM winners ORDER BY date DESC LIMIT ?').all(limit) as Winner[];
  }

  async getWinnersByDate(date: string): Promise<Winner[]> {
    return this.db.prepare('SELECT * FROM winners WHERE date = ?').all(date) as Winner[];
  }
}

export const storage = new SQLiteStorage();
