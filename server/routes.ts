import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { StellarService } from "./services/stellar";
import { generateToken, authenticateToken, type AuthRequest } from "./middleware/auth";
import { insertBusinessSchema, loginSchema, sendMoneySchema, createInvoiceSchema } from "@shared/schema";
import { walletMonitor } from "./services/wallet-monitor";

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
      
      // Get the actual balance after funding (should be ~10,000 XLM)
      const actualBalance = await StellarService.getXLMBalance(stellarWallet.publicKey);
      
      const wallet = await storage.createWallet({
        businessId: business.id,
        publicKey: stellarWallet.publicKey,
        secretKey: stellarWallet.secretKey,
        balance: actualBalance,
      });

      // Start monitoring the new wallet for incoming transactions
      await walletMonitor.startMonitoring(stellarWallet.publicKey, business.id);

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

      // Get current XLM balance from Stellar
      const balance = await StellarService.getXLMBalance(wallet.publicKey);
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

      // Check if destination is another Remitro wallet
      const recipientWallet = await storage.getWalletByPublicKey(destinationAddress);
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        fromBusinessId: req.businessId!,
        toAddress: destinationAddress,
        toBusinessId: recipientWallet?.businessId || null,
        amount,
        memo: memo || null,
        type: "send",
      });

      try {
        // Send XLM on Stellar
        const stellarTxHash = await StellarService.sendXLM(
          wallet.secretKey,
          destinationAddress,
          amount,
          memo
        );

        // Update transaction status
        await storage.updateTransactionStatus(transaction.id, "completed", stellarTxHash);

        // Update sender wallet balance
        const newBalance = await StellarService.getXLMBalance(wallet.publicKey);
        await storage.updateWalletBalance(wallet.id, newBalance);

        // If this is an internal transfer, create a receive transaction for the recipient
        if (recipientWallet) {
          await storage.createTransaction({
            fromBusinessId: recipientWallet.businessId,
            toAddress: wallet.publicKey,
            toBusinessId: recipientWallet.businessId,
            amount,
            memo: memo || null,
            type: "receive",
          });

          // Update recipient wallet balance
          const recipientBalance = await StellarService.getXLMBalance(recipientWallet.publicKey);
          await storage.updateWalletBalance(recipientWallet.id, recipientBalance);
        }

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

  // Create payment request/invoice
  app.post("/api/invoices", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { toBusinessEmail, amount, memo } = createInvoiceSchema.parse(req.body);
      
      // Find recipient business
      const recipientBusiness = await storage.getBusinessByEmail(toBusinessEmail);
      if (!recipientBusiness) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Create payment request
      const paymentRequest = await storage.createPaymentRequest({
        fromBusinessId: req.businessId!,
        toBusinessId: recipientBusiness.id,
        amount,
        memo: memo || null,
      });

      res.json({ paymentRequest });
    } catch (error) {
      console.error("Create invoice error:", error);
      res.status(400).json({ message: "Failed to create payment request" });
    }
  });

  // Get payment requests for current business
  app.get("/api/payment-requests", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const paymentRequests = await storage.getPaymentRequestsByBusinessId(req.businessId!);
      
      // Get business names for payment requests
      const enrichedRequests = await Promise.all(
        paymentRequests.map(async (request) => {
          const fromBusiness = await storage.getBusinessById(request.fromBusinessId);
          return {
            ...request,
            fromBusinessName: fromBusiness?.name || "Unknown",
            fromBusinessEmail: fromBusiness?.email || "Unknown",
          };
        })
      );

      res.json(enrichedRequests);
    } catch (error) {
      console.error("Payment requests error:", error);
      res.status(500).json({ message: "Failed to fetch payment requests" });
    }
  });

  // Pay a payment request
  app.post("/api/payment-requests/:id/pay", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const paymentRequest = await storage.getPaymentRequestById(requestId);
      
      if (!paymentRequest) {
        return res.status(404).json({ message: "Payment request not found" });
      }

      if (paymentRequest.toBusinessId !== req.businessId) {
        return res.status(403).json({ message: "Not authorized to pay this request" });
      }

      if (paymentRequest.status !== "pending") {
        return res.status(400).json({ message: "Payment request is not pending" });
      }

      // Get payer wallet
      const payerWallet = await storage.getWalletByBusinessId(req.businessId!);
      if (!payerWallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      // Get recipient wallet
      const recipientWallet = await storage.getWalletByBusinessId(paymentRequest.fromBusinessId);
      if (!recipientWallet) {
        return res.status(404).json({ message: "Recipient wallet not found" });
      }

      // Create transaction record
      const transaction = await storage.createTransaction({
        fromBusinessId: req.businessId!,
        toAddress: recipientWallet.publicKey,
        toBusinessId: paymentRequest.fromBusinessId,
        amount: paymentRequest.amount,
        memo: paymentRequest.memo || null,
        type: "send",
      });

      try {
        // Send XLM on Stellar
        const stellarTxHash = await StellarService.sendXLM(
          payerWallet.secretKey,
          recipientWallet.publicKey,
          paymentRequest.amount,
          paymentRequest.memo || undefined
        );

        // Update transaction status
        await storage.updateTransactionStatus(transaction.id, "completed", stellarTxHash);

        // Update payment request status
        await storage.updatePaymentRequestStatus(requestId, "paid", transaction.id);

        // Update both wallet balances
        const payerBalance = await StellarService.getXLMBalance(payerWallet.publicKey);
        const recipientBalance = await StellarService.getXLMBalance(recipientWallet.publicKey);
        await storage.updateWalletBalance(payerWallet.id, payerBalance);
        await storage.updateWalletBalance(recipientWallet.id, recipientBalance);

        // Create receive transaction for recipient
        await storage.createTransaction({
          fromBusinessId: paymentRequest.fromBusinessId,
          toAddress: recipientWallet.publicKey,
          toBusinessId: paymentRequest.fromBusinessId,
          amount: paymentRequest.amount,
          memo: paymentRequest.memo || null,
          type: "receive",
        });

        res.json({
          transactionId: transaction.id,
          stellarTxHash,
          status: "completed",
        });
      } catch (stellarError) {
        await storage.updateTransactionStatus(transaction.id, "failed");
        throw stellarError;
      }
    } catch (error) {
      console.error("Pay request error:", error);
      res.status(400).json({ message: "Payment failed" });
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
            balance = await StellarService.getXLMBalance(wallet.publicKey);
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
