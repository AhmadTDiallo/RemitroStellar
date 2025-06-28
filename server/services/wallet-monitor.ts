import { StellarService } from "./stellar";
import { storage } from "../storage";

export class WalletMonitorService {
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  // Start monitoring a wallet for incoming transactions
  async startMonitoring(publicKey: string, businessId: number) {
    // Don't start if already monitoring
    if (this.monitoringIntervals.has(publicKey)) {
      return;
    }

    let lastCheckedLedger = await this.getLatestLedger();
    
    const interval = setInterval(async () => {
      try {
        await this.checkForNewTransactions(publicKey, businessId, lastCheckedLedger);
        lastCheckedLedger = await this.getLatestLedger();
      } catch (error) {
        console.error(`Error monitoring wallet ${publicKey}:`, error);
      }
    }, 10000); // Check every 10 seconds

    this.monitoringIntervals.set(publicKey, interval);
    console.log(`Started monitoring wallet: ${publicKey}`);
  }

  // Stop monitoring a wallet
  stopMonitoring(publicKey: string) {
    const interval = this.monitoringIntervals.get(publicKey);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(publicKey);
      console.log(`Stopped monitoring wallet: ${publicKey}`);
    }
  }

  // Get the latest ledger number from Stellar network
  private async getLatestLedger(): Promise<number> {
    try {
      const response = await fetch("https://horizon-testnet.stellar.org/ledgers?order=desc&limit=1");
      const data = await response.json();
      return data._embedded.records[0].sequence;
    } catch (error) {
      console.error("Error fetching latest ledger:", error);
      return 0;
    }
  }

  // Check for new transactions since last check
  private async checkForNewTransactions(publicKey: string, businessId: number, sinceLocally: number) {
    try {
      // Get payments to this account since the last check
      const response = await fetch(
        `https://horizon-testnet.stellar.org/accounts/${publicKey}/payments?order=desc&limit=20`
      );
      
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const payments = data._embedded.records;

      for (const payment of payments) {
        // Only process payments TO this account (not from)
        if (payment.to === publicKey && payment.asset_type === "native") {
          // Check if we already recorded this transaction
          const existingTx = await this.isTransactionRecorded(payment.transaction_hash);
          
          if (!existingTx) {
            // Create a receive transaction record
            const transaction = await storage.createTransaction({
              fromBusinessId: businessId,
              toAddress: publicKey,
              toBusinessId: businessId,
              amount: payment.amount,
              memo: payment.transaction.memo || null,
              type: "receive",
            });

            // Update with Stellar transaction hash
            await storage.updateTransactionStatus(transaction.id, "completed", payment.transaction_hash);

            // Update wallet balance
            const wallet = await storage.getWalletByBusinessId(businessId);
            if (wallet) {
              const newBalance = await StellarService.getXLMBalance(publicKey);
              await storage.updateWalletBalance(wallet.id, newBalance);
            }

            console.log(`Recorded incoming payment: ${payment.amount} XLM to ${publicKey}`);
          }
        }
      }
    } catch (error) {
      console.error("Error checking for new transactions:", error);
    }
  }

  // Check if a transaction with this Stellar hash already exists
  private async isTransactionRecorded(stellarTxHash: string): Promise<boolean> {
    const allTransactions = await storage.getAllTransactions();
    return allTransactions.some(tx => tx.stellarTxHash === stellarTxHash);
  }

  // Start monitoring all existing wallets
  async startMonitoringAllWallets() {
    const businesses = await storage.getAllBusinesses();
    
    for (const business of businesses) {
      const wallet = await storage.getWalletByBusinessId(business.id);
      if (wallet) {
        await this.startMonitoring(wallet.publicKey, business.id);
      }
    }
  }
}

export const walletMonitor = new WalletMonitorService();