import { 
  businesses, 
  wallets, 
  transactions, 
  paymentRequests,
  type Business, 
  type InsertBusiness, 
  type Wallet, 
  type InsertWallet, 
  type Transaction, 
  type InsertTransaction,
  type PaymentRequest,
  type InsertPaymentRequest
} from "@shared/schema";
import bcrypt from "bcrypt";

export interface IStorage {
  // Business operations
  createBusiness(business: InsertBusiness): Promise<Business>;
  getBusinessByEmail(email: string): Promise<Business | undefined>;
  getBusinessById(id: number): Promise<Business | undefined>;
  getAllBusinesses(): Promise<Business[]>;
  verifyPassword(password: string, hashedPassword: string): Promise<boolean>;

  // Wallet operations
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  getWalletByBusinessId(businessId: number): Promise<Wallet | undefined>;
  getWalletByPublicKey(publicKey: string): Promise<Wallet | undefined>;
  updateWalletBalance(walletId: number, balance: string): Promise<void>;

  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByBusinessId(businessId: number): Promise<Transaction[]>;
  updateTransactionStatus(id: number, status: string, stellarTxHash?: string): Promise<void>;
  getAllTransactions(): Promise<Transaction[]>;

  // Payment request operations
  createPaymentRequest(paymentRequest: InsertPaymentRequest): Promise<PaymentRequest>;
  getPaymentRequestsByBusinessId(businessId: number): Promise<PaymentRequest[]>;
  updatePaymentRequestStatus(id: number, status: string, transactionId?: number): Promise<void>;
  getPaymentRequestById(id: number): Promise<PaymentRequest | undefined>;
}

export class MemStorage implements IStorage {
  private businesses: Map<number, Business>;
  private wallets: Map<number, Wallet>;
  private transactions: Map<number, Transaction>;
  private paymentRequests: Map<number, PaymentRequest>;
  private currentBusinessId: number;
  private currentWalletId: number;
  private currentTransactionId: number;
  private currentPaymentRequestId: number;

  constructor() {
    this.businesses = new Map();
    this.wallets = new Map();
    this.transactions = new Map();
    this.paymentRequests = new Map();
    this.currentBusinessId = 1;
    this.currentWalletId = 1;
    this.currentTransactionId = 1;
    this.currentPaymentRequestId = 1;
  }

  async createBusiness(insertBusiness: InsertBusiness): Promise<Business> {
    const hashedPassword = await bcrypt.hash(insertBusiness.password, 10);
    const id = this.currentBusinessId++;
    const business: Business = {
      ...insertBusiness,
      id,
      password: hashedPassword,
      createdAt: new Date(),
    };
    this.businesses.set(id, business);
    return business;
  }

  async getBusinessByEmail(email: string): Promise<Business | undefined> {
    return Array.from(this.businesses.values()).find(
      (business) => business.email === email
    );
  }

  async getBusinessById(id: number): Promise<Business | undefined> {
    return this.businesses.get(id);
  }

  async getAllBusinesses(): Promise<Business[]> {
    return Array.from(this.businesses.values());
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const id = this.currentWalletId++;
    const wallet: Wallet = {
      ...insertWallet,
      id,
      balance: insertWallet.balance || "0",
      createdAt: new Date(),
    };
    this.wallets.set(id, wallet);
    return wallet;
  }

  async getWalletByBusinessId(businessId: number): Promise<Wallet | undefined> {
    return Array.from(this.wallets.values()).find(
      (wallet) => wallet.businessId === businessId
    );
  }

  async getWalletByPublicKey(publicKey: string): Promise<Wallet | undefined> {
    return Array.from(this.wallets.values()).find(
      (wallet) => wallet.publicKey === publicKey
    );
  }

  async updateWalletBalance(walletId: number, balance: string): Promise<void> {
    const wallet = this.wallets.get(walletId);
    if (wallet) {
      wallet.balance = balance;
      this.wallets.set(walletId, wallet);
    }
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      memo: insertTransaction.memo ?? null,
      fromBusinessId: insertTransaction.fromBusinessId ?? null,
      toBusinessId: insertTransaction.toBusinessId ?? null,
      createdAt: new Date(),
      status: "pending",
      stellarTxHash: null,
      type: insertTransaction.type ?? "send",
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransactionsByBusinessId(businessId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.fromBusinessId === businessId
    );
  }

  async updateTransactionStatus(
    id: number, 
    status: string, 
    stellarTxHash?: string
  ): Promise<void> {
    const transaction = this.transactions.get(id);
    if (transaction) {
      transaction.status = status;
      if (stellarTxHash) {
        transaction.stellarTxHash = stellarTxHash;
      }
      this.transactions.set(id, transaction);
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async createPaymentRequest(insertPaymentRequest: InsertPaymentRequest): Promise<PaymentRequest> {
    const id = this.currentPaymentRequestId++;
    const paymentRequest: PaymentRequest = {
      ...insertPaymentRequest,
      id,
      memo: insertPaymentRequest.memo ?? null,
      status: "pending",
      transactionId: null,
      createdAt: new Date(),
    };
    this.paymentRequests.set(id, paymentRequest);
    return paymentRequest;
  }

  async getPaymentRequestsByBusinessId(businessId: number): Promise<PaymentRequest[]> {
    return Array.from(this.paymentRequests.values()).filter(
      (request) => request.toBusinessId === businessId
    );
  }

  async updatePaymentRequestStatus(id: number, status: string, transactionId?: number): Promise<void> {
    const paymentRequest = this.paymentRequests.get(id);
    if (paymentRequest) {
      paymentRequest.status = status;
      if (transactionId) {
        paymentRequest.transactionId = transactionId;
      }
      this.paymentRequests.set(id, paymentRequest);
    }
  }

  async getPaymentRequestById(id: number): Promise<PaymentRequest | undefined> {
    return this.paymentRequests.get(id);
  }
}

export const storage = new MemStorage();
