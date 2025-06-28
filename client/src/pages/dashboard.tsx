import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { isAuthenticated, removeAuthToken, getAuthToken } from "@/lib/auth";
import { WalletCard } from "@/components/wallet-card";
import { SendMoneyForm } from "@/components/send-money-form";
import { TransactionHistory } from "@/components/transaction-history";
import { CreateInvoiceForm } from "@/components/create-invoice-form";
import { PaymentRequests } from "@/components/payment-requests";
import { Button } from "@/components/ui/button";
import { DollarSign, FileText, LogOut, Receipt } from "lucide-react";

export default function DashboardPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation("/");
    }
  }, [setLocation]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated(),
    queryFn: async () => {
      const response = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      return response.json();
    },
  });

  const handleLogout = () => {
    removeAuthToken();
    setLocation("/");
  };

  if (!isAuthenticated()) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-800 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Remitro</h1>
                <p className="text-sm text-gray-500">{profile?.business?.name}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/admin")}
              className="text-gray-600 hover:text-gray-800"
            >
              <FileText className="w-4 h-4 mr-2" />
              Admin Panel
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <span className="text-sm font-medium text-gray-900">
                {profile?.business?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Wallet Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <WalletCard wallet={profile?.wallet} />
            
            {/* Balance Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">XLM Balance</h3>
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {parseFloat(profile?.wallet?.balance || "0").toFixed(7)} XLM
                  </p>
                  <p className="text-sm text-gray-500">Available Balance</p>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer">
                    Refresh Balance
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">This Month</h3>
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-500">Transactions</p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Volume:</span>
                  <span className="font-medium text-gray-900">0 XLM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <SendMoneyForm />
            <CreateInvoiceForm />
          </div>

          {/* Payment Requests and Transaction History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PaymentRequests />
            <TransactionHistory />
          </div>
        </div>
      </div>
    </div>
  );
}
