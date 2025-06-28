import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { isAuthenticated, removeAuthToken } from "@/lib/auth";
import { getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { DollarSign, FileText, LogOut, Receipt, Copy, Check } from "lucide-react";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation("/");
    }
  }, [setLocation]);

  interface ProfileData {
    business: {
      id: number;
      name: string;
      email: string;
    };
    wallet: {
      publicKey: string;
      balance: string;
    };
  }

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated(),
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const handleLogout = () => {
    removeAuthToken();
    setLocation("/");
  };

  const copyWalletAddress = async () => {
    if (!profile?.wallet?.publicKey) return;
    
    try {
      await navigator.clipboard.writeText(profile.wallet.publicKey);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the address manually",
        variant: "destructive",
      });
    }
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
              onClick={() => setLocation("/send-money")}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-slate-800"
            >
              <DollarSign className="w-4 h-4" />
              <span>Send Money</span>
            </button>
            <button 
              onClick={() => setLocation("/invoices")}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-slate-800"
            >
              <FileText className="w-4 h-4" />
              <span>Invoices</span>
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

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div 
              onClick={() => setLocation("/send-money")}
              className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Send Money</h3>
                  <p className="text-blue-100 text-sm">Transfer XLM instantly</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div 
              onClick={() => setLocation("/invoices")}
              className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white cursor-pointer hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Create Invoice</h3>
                  <p className="text-green-100 text-sm">Request payments</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Receipt className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div 
              onClick={copyWalletAddress}
              className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white cursor-pointer hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold">Wallet Address</h3>
                    {copied && <Check className="w-4 h-4 text-green-300" />}
                  </div>
                  <p className="text-purple-100 text-sm font-mono break-all">
                    {profile?.wallet?.publicKey ? 
                      profile.wallet.publicKey : 
                      'Loading...'
                    }
                  </p>
                  <p className="text-purple-200 text-xs mt-1">
                    {copied ? 'Copied!' : 'Click to copy'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center ml-4">
                  {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setLocation("/send-money")}
                  className="text-blue-600 hover:text-blue-700"
                >
                  View All
                </Button>
              </div>
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Start by sending money or creating an invoice</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Payment Requests</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setLocation("/invoices")}
                  className="text-blue-600 hover:text-blue-700"
                >
                  View All
                </Button>
              </div>
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No payment requests</p>
                  <p className="text-sm">Incoming payment requests will appear here</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
