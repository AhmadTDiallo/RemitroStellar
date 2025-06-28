import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Transaction {
  id: number;
  fromBusinessId: number | null;
  toAddress: string;
  toBusinessId: number | null;
  amount: string;
  memo: string | null;
  stellarTxHash: string | null;
  status: string;
  type: string;
  createdAt: string;
}

export function TransactionHistory() {
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "failed":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "send":
        return <ArrowUpRight className="w-5 h-5 text-red-600" />;
      case "receive":
        return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
      case "invoice":
        return <Receipt className="w-5 h-5 text-blue-600" />;
      default:
        return <ArrowUpRight className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionLabel = (transaction: Transaction) => {
    switch (transaction.type) {
      case "send":
        return `Sent to ${formatAddress(transaction.toAddress)}`;
      case "receive":
        return `Received from ${formatAddress(transaction.toAddress)}`;
      case "invoice":
        return `Invoice payment to ${formatAddress(transaction.toAddress)}`;
      default:
        return `Transfer to ${formatAddress(transaction.toAddress)}`;
    }
  };

  const getTransactionBackground = (type: string) => {
    switch (type) {
      case "send":
        return "bg-red-100";
      case "receive":
        return "bg-green-100";
      case "invoice":
        return "bg-blue-100";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Recent Transactions</h3>
        <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700">
          View All
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions && transactions.length > 0 ? (
          transactions.map((transaction: Transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${getTransactionBackground(transaction.type)} rounded-full flex items-center justify-center`}>
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {getTransactionLabel(transaction)}
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </p>
                    {transaction.stellarTxHash && (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${transaction.stellarTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {transaction.memo && (
                    <p className="text-xs text-gray-500 mt-1">"{transaction.memo}"</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  -{parseFloat(transaction.amount).toFixed(7)} XLM
                </p>
                <p className={`text-xs px-2 py-1 rounded-full inline-block capitalize ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowUpRight className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No transactions yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Your transaction history will appear here
            </p>
          </div>
        )}

        {transactions && transactions.length > 0 && (
          <div className="text-center pt-4 border-t border-gray-200">
            <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700">
              Load More Transactions
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
