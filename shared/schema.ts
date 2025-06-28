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
  amount: decimal("amount", { precision: 18, scale: 7 }).notNull(),
  memo: text("memo"),
  stellarTxHash: text("stellar_tx_hash"),
  status: text("status").notNull().default("pending"), // pending, completed, failed
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

export const sendMoneySchema = z.object({
  destinationAddress: z.string().min(56).max(56), // Stellar address length
  amount: z.string().min(1).regex(/^\d+(\.\d{1,7})?$/, "Invalid XLM amount format"), // XLM has 7 decimal places
  memo: z.string().optional(),
});

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type SendMoneyData = z.infer<typeof sendMoneySchema>;
