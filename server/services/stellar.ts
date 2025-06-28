import { Keypair, Horizon, TransactionBuilder, Operation, Asset, Account, Networks, Memo } from "stellar-sdk";

const server = new Horizon.Server("https://horizon-testnet.stellar.org");

export interface StellarWallet {
  publicKey: string;
  secretKey: string;
}

export class StellarService {
  private static USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"; // USDC issuer on testnet
  private static USDC_ASSET = new Asset("USDC", this.USDC_ISSUER);

  static async createWallet(): Promise<StellarWallet> {
    const keypair = Keypair.random();
    
    try {
      // Fund the account with testnet XLM
      const response = await fetch(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`);
      if (!response.ok) {
        throw new Error("Failed to fund testnet account");
      }

      // Add USDC trustline
      await this.addUSDCTrustline(keypair.secret());

      return {
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret(),
      };
    } catch (error) {
      console.error("Error creating wallet:", error);
      throw new Error("Failed to create Stellar wallet");
    }
  }

  static async addUSDCTrustline(secretKey: string): Promise<void> {
    try {
      const keypair = Keypair.fromSecret(secretKey);
      const account = await server.loadAccount(keypair.publicKey());

      const transaction = new TransactionBuilder(account, {
        fee: "100000",
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.changeTrust({
            asset: this.USDC_ASSET,
          })
        )
        .setTimeout(180)
        .build();

      transaction.sign(keypair);
      await server.submitTransaction(transaction);
    } catch (error) {
      console.error("Error adding USDC trustline:", error);
      throw new Error("Failed to add USDC trustline");
    }
  }

  static async getUSDCBalance(publicKey: string): Promise<string> {
    try {
      const account = await server.loadAccount(publicKey);
      const usdcBalance = account.balances.find(
        (balance) => 
          balance.asset_type !== "native" && 
          'asset_code' in balance &&
          balance.asset_code === "USDC" &&
          'asset_issuer' in balance &&
          balance.asset_issuer === this.USDC_ISSUER
      );
      
      return usdcBalance ? usdcBalance.balance : "0";
    } catch (error) {
      console.error("Error getting USDC balance:", error);
      return "0";
    }
  }

  static async sendUSDC(
    fromSecretKey: string,
    toPublicKey: string,
    amount: string,
    memo?: string
  ): Promise<string> {
    try {
      const sourceKeypair = Keypair.fromSecret(fromSecretKey);
      const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

      const transactionBuilder = new TransactionBuilder(sourceAccount, {
        fee: "100000",
        networkPassphrase: Networks.TESTNET,
      });

      transactionBuilder.addOperation(
        Operation.payment({
          destination: toPublicKey,
          asset: this.USDC_ASSET,
          amount: amount,
        })
      );

      if (memo) {
        transactionBuilder.addMemo(Memo.text(memo));
      }

      const transaction = transactionBuilder.setTimeout(180).build();
      transaction.sign(sourceKeypair);

      const result = await server.submitTransaction(transaction);
      return result.hash;
    } catch (error) {
      console.error("Error sending USDC:", error);
      throw new Error("Failed to send USDC transaction");
    }
  }

  static async isValidAddress(address: string): Promise<boolean> {
    try {
      await server.loadAccount(address);
      return true;
    } catch (error) {
      return false;
    }
  }
}
