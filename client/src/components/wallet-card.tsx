import { useState } from "react";
import { Copy, Wallet, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletCardProps {
  wallet?: {
    publicKey: string;
    balance: string;
  };
}

export function WalletCard({ wallet }: WalletCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyAddress = async () => {
    if (!wallet?.publicKey) return;
    
    try {
      await navigator.clipboard.writeText(wallet.publicKey);
      setCopied(true);
      toast({
        title: "Address copied!",
        description: "Wallet address has been copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy address to clipboard.",
        variant: "destructive",
      });
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Stellar Wallet</h3>
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Wallet className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-500 mb-1">Public Address</p>
          <div className="flex items-center space-x-2">
            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-800">
              {wallet?.publicKey ? formatAddress(wallet.publicKey) : "Loading..."}
            </code>
            <button
              onClick={copyAddress}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={!wallet?.publicKey}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100">
          <p className="text-sm text-gray-500">Testnet Account</p>
          <p className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full inline-block">
            Active
          </p>
        </div>
      </div>
    </div>
  );
}
