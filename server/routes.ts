import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { StellarService } from "./services/stellar";
import { generateToken, authenticateToken, type AuthRequest } from "./middleware/auth";
import { insertBusinessSchema, loginSchema, sendMoneySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Business registration
  app.post("/api/register", async (req, res) => {
    try {
      const validatedData = insertBusinessSchema.parse(req.body);
      
      // Check if business already exists
      const existingBusiness = await storage.getBusinessByEmail(validatedData.email);
      if (existingBusiness) {
        return res.status(400).json({ message: "Business with this email already exists" });
      }

      // Create business
      const business = await storage.createBusiness(validatedData);

      // Create Stellar wallet
      const stellarWallet = await StellarService.createWallet();
      await storage.createWallet({
        businessId: business.id,
        publicKey: stellarWallet.publicKey,
        secretKey: stellarWallet.secretKey,
        balance: "0",
      });

      // Generate JWT token
      const token = generateToken(business.id);

      res.status(201).json({
        token,
        business: {
          id: business.id,
          name: business.name,
          email: business.email,
        },
        wallet: {
          publicKey: stellarWallet.publicKey,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  // Business login
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const business = await storage.getBusinessByEmail(email);
      if (!business) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValidPassword = await storage.verifyPassword(password, business.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = generateToken(business.id);

      res.json({
        token,
        business: {
          id: business.id,
          name: business.name,
          email: business.email,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed" });
    }
  });

  // Get business profile and wallet info
  app.get("/api/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const business = await storage.getBusinessById(req.businessId!);
      const wallet = await storage.getWalletByBusinessId(req.businessId!);

      if (!business || !wallet) {
        return res.status(404).json({ message: "Business or wallet not found" });
      }

      // Get current USDC balance from Stellar
      const balance = await StellarService.getUSDCBalance(wallet.publicKey);
      await storage.updateWalletBalance(wallet.id, balance);

      res.json({
        business: {
          id: business.id,
          name: business.name,
          email: business.email,
        },
        wallet: {
          publicKey: wallet.publicKey,
          balance,
        },
      });
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Send USDC
  app.post("/api/send", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { destinationAddress, amount, memo } = sendMoneySchema.parse(req.body);

      const wallet = await storage.getWalletByBusinessId(req.businessId!);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      // Validate destination address
      const isValidAddress = await StellarService.isValidAddress(destinationAddress);
      if (!isValidAddress) {
        return res.status(400).json({ message: "Invalid destination address" });
      }

      // Create transaction record
      const transaction = await storage.createTransaction({
        fromBusinessId: req.businessId!,
        toAddress: destinationAddress,
        amount,
        memo: memo || null,
      });

      try {
        // Send USDC on Stellar
        const stellarTxHash = await StellarService.sendUSDC(
          wallet.secretKey,
          destinationAddress,
          amount,
          memo
        );

        // Update transaction status
        await storage.updateTransactionStatus(transaction.id, "completed", stellarTxHash);

        // Update wallet balance
        const newBalance = await StellarService.getUSDCBalance(wallet.publicKey);
        await storage.updateWalletBalance(wallet.id, newBalance);

        res.json({
          transactionId: transaction.id,
          stellarTxHash,
          status: "completed",
        });
      } catch (stellarError) {
        // Update transaction status to failed
        await storage.updateTransactionStatus(transaction.id, "failed");
        throw stellarError;
      }
    } catch (error) {
      console.error("Send error:", error);
      res.status(400).json({ message: "Transaction failed" });
    }
  });

  // Get transaction history
  app.get("/api/transactions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const transactions = await storage.getTransactionsByBusinessId(req.businessId!);
      res.json(transactions);
    } catch (error) {
      console.error("Transactions error:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Admin routes
  app.get("/api/admin/businesses", async (req, res) => {
    try {
      const businesses = await storage.getAllBusinesses();
      const businessesWithWallets = await Promise.all(
        businesses.map(async (business) => {
          const wallet = await storage.getWalletByBusinessId(business.id);
          const transactions = await storage.getTransactionsByBusinessId(business.id);
          
          let balance = "0";
          if (wallet) {
            balance = await StellarService.getUSDCBalance(wallet.publicKey);
            await storage.updateWalletBalance(wallet.id, balance);
          }

          return {
            id: business.id,
            name: business.name,
            email: business.email,
            createdAt: business.createdAt,
            wallet: wallet ? {
              publicKey: wallet.publicKey,
              balance,
            } : null,
            transactionCount: transactions.length,
          };
        })
      );

      res.json(businessesWithWallets);
    } catch (error) {
      console.error("Admin businesses error:", error);
      res.status(500).json({ message: "Failed to fetch businesses" });
    }
  });

  app.get("/api/admin/transactions", async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Admin transactions error:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
