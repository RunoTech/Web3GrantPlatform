import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { testRpcConnection, startAllCampaignListeners, getCampaignListenersStatus } from "./blockchain";
import { storage } from "./storage";

const app = express();

// Security: Trust proxy for accurate rate limiting
app.set('trust proxy', 1);

// Security: Add security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Security: Enable CORS with restrictions
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5000',
    'https://localhost:5000',
    process.env.FRONTEND_URL,
    // Add your production domains here
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Security: Rate limiting - General API protection
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security: Strict rate limiting for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 requests per hour
  message: {
    error: "Too many attempts, please try again later.",
    retryAfter: "1 hour"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/admin/login', strictLimiter);
app.use('/api/activate-account', strictLimiter);

// Security: Request size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Skip blockchain connection test for now
  console.log("🔗 Skipping blockchain connection test for demo...");

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`🚀 serving on port ${port}`);
    
    // Initialize automatic donation detection system
    try {
      console.log("🔗 Starting blockchain monitoring for campaign donations...");
      
      // Get all active campaigns
      const activeCampaigns = await storage.getCampaigns();
      const campaignsToMonitor = activeCampaigns
        .filter(c => c.approved && c.active)
        .map(c => ({
          id: c.id,
          ownerWallet: c.ownerWallet,
          status: 'active'
        }));
      
      if (campaignsToMonitor.length > 0) {
        // Donation received callback - automatically record donations
        const onDonationReceived = async (donationData: any) => {
          try {
            console.log(`💾 Recording donation: ${donationData.amount} USDT to Campaign #${donationData.campaignId}`);
            
            const donation = await storage.createDonation({
              campaignId: donationData.campaignId,
              donorWallet: donationData.donorWallet,
              amount: donationData.amount,
              txHash: donationData.txHash,
              network: donationData.network
            });
            
            console.log(`✅ Donation recorded: ID #${donation.id}`);
            
          } catch (error) {
            console.error("Failed to record donation:", error);
          }
        };
        
        // Start listeners for all campaigns
        const result = await startAllCampaignListeners(campaignsToMonitor, onDonationReceived);
        
        if (result.success) {
          console.log(`✅ Automatic donation detection active for ${result.started} campaigns`);
          console.log("📊 Server ready - blockchain monitoring ENABLED");
        } else {
          console.error("❌ Failed to start campaign listeners");
          console.log("📊 Server ready - blockchain monitoring FAILED");
        }
      } else {
        console.log("⚠️  No active campaigns found - blockchain monitoring skipped");
        console.log("📊 Server ready - blockchain monitoring DISABLED");
      }
      
    } catch (error) {
      console.error("Failed to initialize blockchain monitoring:", error);
      console.log("📊 Server ready - blockchain monitoring FAILED");
    }
  });
})();
