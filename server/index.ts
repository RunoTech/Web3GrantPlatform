import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { testRpcConnection, startWalletListener } from "./blockchain";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  // Test blockchain connection
  console.log("🔗 Testing blockchain connection...");
  const rpcTest = await testRpcConnection();
  if (!rpcTest.success) {
    console.warn("⚠️ RPC connection failed, payment verification may not work");
  }

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
    
    // Start real-time wallet listener after server is running
    if (rpcTest.success) {
      const listenerResult = await startWalletListener("0x742d35cc6734c0532925a3b8d4037d4d40da5f1e", (payment) => {
        console.log(`🎉 INSTANT PAYMENT RECEIVED!`);
        console.log(`💵 Amount: ${payment.amount} ${payment.token}`);
        console.log(`👤 From: ${payment.from}`);
        console.log(`🔗 TX: ${payment.txHash}`);
        console.log(`⏰ Time: ${payment.timestamp}`);
        
        // Here you could:
        // 1. Auto-activate user accounts
        // 2. Send notifications
        // 3. Update database immediately
        // 4. Trigger webhooks
      });
      
      if (listenerResult.success) {
        console.log(`✅ Real-time payment monitoring active (${listenerResult.provider})`);
      } else {
        console.warn(`⚠️ Payment monitoring failed: ${listenerResult.error}`);
      }
    }
  });
})();
