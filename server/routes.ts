import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { networks, ERC20_ABI } from "./config/networks.js";
import { ethers } from "ethers";
import { insertCampaignSchema, insertDailyEntrySchema } from "@shared/schema";

const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';

function requireAdmin(req: Request, res: Response, next: Function) {
  const adminKey = req.headers['x-admin-key'] || req.body.adminKey;
  if (adminKey !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Admin anahtarı gerekli' });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get current fees
  app.get('/api/fees', async (req: Request, res: Response) => {
    try {
      const fees = await storage.getFees();
      const result: any = {};
      
      fees.forEach(fee => {
        result[fee.network] = {
          symbol: fee.tokenSymbol,
          address: fee.tokenAddress,
          decimals: fee.decimals,
          amount: fee.amount
        };
      });
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Ücretler alınamadı' });
    }
  });

  // Update fee (admin only)
  app.post('/api/admin/update-fee', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { network, token_symbol, token_address, decimals, amount } = req.body;
      
      await storage.updateFee({
        network,
        tokenSymbol: token_symbol,
        tokenAddress: token_address,
        decimals,
        amount
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Ücret güncellenemedi' });
    }
  });

  // Verify payment and activate account
  app.post('/api/verify-payment', async (req: Request, res: Response) => {
    try {
      const { network, wallet, txHash } = req.body;
      
      if (!networks[network]) {
        return res.status(400).json({ error: 'Desteklenmeyen ağ' });
      }

      const provider = new ethers.JsonRpcProvider(networks[network].rpcUrl);
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return res.status(400).json({ error: 'İşlem bulunamadı' });
      }

      const fees = await storage.getFees();
      const networkFee = fees.find(f => f.network === network);
      
      if (!networkFee) {
        return res.status(400).json({ error: 'Ağ ücreti bulunamadı' });
      }

      const tokenContract = new ethers.Contract(networkFee.tokenAddress, ERC20_ABI, provider);
      
      // Parse transfer events
      const transferEvents = receipt.logs
        .map(log => {
          try {
            return tokenContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .filter(event => event && event.name === 'Transfer');

      const validTransfer = transferEvents.find(event => {
        const to = event.args.to.toLowerCase();
        const value = BigInt(event.args.value.toString());
        const requiredAmount = BigInt(networkFee.amount);
        
        return to === networks[network].platformWallet.toLowerCase() && value >= requiredAmount;
      });

      if (!validTransfer) {
        return res.status(400).json({ error: 'Geçerli ödeme bulunamadı' });
      }

      // Activate account
      const existingAccount = await storage.getAccount(wallet);
      if (existingAccount) {
        await storage.updateAccount(wallet, { active: true });
      } else {
        await storage.createAccount({ wallet, active: true });
      }

      res.json({ success: true, message: 'Hesap başarıyla aktifleştirildi' });
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({ error: 'Ödeme doğrulanamadı' });
    }
  });

  // Create campaign
  app.post('/api/create-campaign', async (req: Request, res: Response) => {
    try {
      const { wallet } = req.headers;
      
      if (!wallet) {
        return res.status(400).json({ error: 'Cüzdan adresi gerekli' });
      }

      const account = await storage.getAccount(wallet as string);
      if (!account || !account.active) {
        return res.status(403).json({ error: 'Hesap aktif değil' });
      }

      const validatedData = insertCampaignSchema.parse({
        ...req.body,
        ownerWallet: wallet
      });

      const campaign = await storage.createCampaign(validatedData);
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: 'Kampanya oluşturulamadı' });
    }
  });

  // Get all campaigns
  app.get('/api/get-campaigns', async (req: Request, res: Response) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: 'Kampanyalar alınamadı' });
    }
  });

  // Get popular campaigns
  app.get('/api/get-popular-campaigns', async (req: Request, res: Response) => {
    try {
      const campaigns = await storage.getPopularCampaigns(10);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: 'Popüler kampanyalar alınamadı' });
    }
  });

  // Get single campaign
  app.get('/api/campaign/:id', async (req: Request, res: Response) => {
    try {
      const campaign = await storage.getCampaign(parseInt(req.params.id));
      if (!campaign) {
        return res.status(404).json({ error: 'Kampanya bulunamadı' });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: 'Kampanya alınamadı' });
    }
  });

  // Update campaign (admin only)
  app.post('/api/admin/update-campaign', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id, featured } = req.body;
      await storage.updateCampaign(id, { featured });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Kampanya güncellenemedi' });
    }
  });

  // Join daily reward
  app.post('/api/join-daily-reward', async (req: Request, res: Response) => {
    try {
      const { wallet } = req.body;
      const today = new Date().toISOString().split('T')[0];
      
      const existingEntry = await storage.checkDailyEntry(wallet, today);
      if (existingEntry) {
        return res.status(400).json({ error: 'Bugün zaten katıldınız' });
      }

      await storage.createDailyEntry({ wallet, date: today });
      res.json({ success: true, message: 'Günlük ödüle başarıyla katıldınız' });
    } catch (error) {
      res.status(500).json({ error: 'Günlük ödüle katılamadınız' });
    }
  });

  // Get last winners
  app.get('/api/get-last-winners', async (req: Request, res: Response) => {
    try {
      const winners = await storage.getWinners(10);
      res.json(winners);
    } catch (error) {
      res.status(500).json({ error: 'Kazananlar alınamadı' });
    }
  });

  // Select winners (admin only)
  app.post('/api/admin/select-winners', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { date, count } = req.body;
      const entries = await storage.getDailyEntries(date);
      
      if (entries.length === 0) {
        return res.status(400).json({ error: 'Bu tarih için katılım bulunamadı' });
      }

      // Randomly select winners
      const shuffled = entries.sort(() => 0.5 - Math.random());
      const selectedWinners = shuffled.slice(0, Math.min(count, entries.length));
      
      for (const entry of selectedWinners) {
        await storage.createWinner({ wallet: entry.wallet, date });
      }

      res.json({ 
        success: true, 
        winners: selectedWinners.map(w => w.wallet),
        message: `${selectedWinners.length} kazanan seçildi`
      });
    } catch (error) {
      res.status(500).json({ error: 'Kazananlar seçilemedi' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
