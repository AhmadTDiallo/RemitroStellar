import { pgTable, text, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  publicKey: text("public_key").notNull().unique(),
  secretKey: text("secret_key").notNull(), // In production, this should be encrypted
  balance: decimal("balance", { precision: 18, scale: 7 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  fromBusinessId: integer("from_business_id").references(() => businesses.id),
  toAddress: text("to_address").notNull(),
  toBusinessId: integer("to_business_id").references(() => businesses.id), // For internal Remitro transfers
  amount: decimal("amount", { precision: 18, scale: 7 }).notNull(),
  memo: text("memo"),
  stellarTxHash: text("stellar_tx_hash"),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  type: text("type").notNull().default("send"), // send, receive, invoice
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paymentRequests = pgTable("payment_requests", {
  id: serial("id").primaryKey(),
  fromBusinessId: integer("from_business_id").references(() => businesses.id).notNull(), // Who is requesting payment
  toBusinessId: integer("to_business_id").references(() => businesses.id).notNull(), // Who should pay
  amount: decimal("amount", { precision: 18, scale: 7 }).notNull(),
  memo: text("memo"),
  status: text("status").notNull().default("pending"), // pending, paid, cancelled
  transactionId: integer("transaction_id").references(() => transactions.id), // Linked transaction when paid
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  createdAt: true,
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  stellarTxHash: true,
  status: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const insertPaymentRequestSchema = createInsertSchema(paymentRequests).omit({
  id: true,
  createdAt: true,
  status: true,
  transactionId: true,
});

export const sendMoneySchema = z.object({
  destinationAddress: z.string().min(56).max(56), // Stellar address length
  amount: z.string().min(1).regex(/^\d+(\.\d{1,7})?$/, "Invalid XLM amount format"), // XLM has 7 decimal places
  memo: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  toBusinessEmail: z.string().email(),
  amount: z.string().min(1).regex(/^\d+(\.\d{1,7})?$/, "Invalid XLM amount format"),
  memo: z.string().optional(),
});

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type PaymentRequest = typeof paymentRequests.$inferSelect;
export type InsertPaymentRequest = z.infer<typeof insertPaymentRequestSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type SendMoneyData = z.infer<typeof sendMoneySchema>;
export type CreateInvoiceData = z.infer<typeof createInvoiceSchema>;
