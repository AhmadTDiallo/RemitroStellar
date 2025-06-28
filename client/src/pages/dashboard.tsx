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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">RemitroSuite</span>
          </div>
        </div>

        <nav className="flex-1 px-4">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wide text-gray-400 px-3 py-2">PERSONAL</div>
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg bg-blue-600 text-white">
              <Receipt className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setLocation("/admin")}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-slate-800"
            >
              <FileText className="w-4 h-4" />
              <span>Admin Panel</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile?.business?.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {profile?.business?.email}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-400 hover:text-white">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                <span>Home</span>
                <span>›</span>
                <span className="text-gray-900">Dashboard</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500">Total Balance</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {parseFloat(profile?.wallet?.balance || "0").toFixed(3)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">XLM</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-orange-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                  <p className="text-xs text-gray-500 mt-1">This month</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500">Active Invoices</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                  <p className="text-xs text-gray-500 mt-1">Pending payment</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <LogOut className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500">Total Volume</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">0.000</p>
                  <p className="text-xs text-gray-500 mt-1">XLM sent</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <SendMoneyForm />
            <CreateInvoiceForm />
          </div>

          {/* Data Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PaymentRequests />
            <TransactionHistory />
          </div>
        </main>
      </div>
    </div>
  );
}
