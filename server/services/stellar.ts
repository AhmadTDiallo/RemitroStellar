import { Keypair, Horizon, TransactionBuilder, Operation, Asset, Account, Networks, Memo } from "stellar-sdk";

const server = new Horizon.Server("https://horizon-testnet.stellar.org");

export interface StellarWallet {
  publicKey: string;
  secretKey: string;
}

export class StellarService {
  static async createWallet(): Promise<StellarWallet> {
    const keypair = Keypair.random();
    
    try {
      // Fund the account with testnet XLM
      const response = await fetch(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`);
      if (!response.ok) {
        throw new Error("Failed to fund testnet account");
      }

      // Wait a moment for the funding to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret(),
      };
    } catch (error) {
      console.error("Error creating wallet:", error);
      throw new Error("Failed to create Stellar wallet");
    }
  }

  static async getXLMBalance(publicKey: string): Promise<string> {
    try {
      const account = await server.loadAccount(publicKey);
      const xlmBalance = account.balances.find(
        (balance) => balance.asset_type === "native"
      );
      
      return xlmBalance ? xlmBalance.balance : "0";
    } catch (error) {
      console.error("Error getting XLM balance:", error);
      return "0";
    }
  }

  static async sendXLM(
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
          asset: Asset.native(),
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
      console.error("Error sending XLM:", error);
      throw new Error("Failed to send XLM transaction");
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
