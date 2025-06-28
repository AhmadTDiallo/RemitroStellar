import { useEffect } from "react";
import { useLocation } from "wouter";
import { isAuthenticated, removeAuthToken } from "@/lib/auth";
import { SendMoneyForm } from "@/components/send-money-form";
import { TransactionHistory } from "@/components/transaction-history";
import { Button } from "@/components/ui/button";
import { DollarSign, FileText, LogOut, Receipt, ArrowLeft } from "lucide-react";

export default function SendMoneyPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation("/");
    }
  }, [setLocation]);

  const handleLogout = () => {
    removeAuthToken();
    setLocation("/");
  };

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
            <button 
              onClick={() => setLocation("/dashboard")}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-slate-800"
            >
              <Receipt className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg bg-blue-600 text-white">
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
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full text-gray-400 hover:text-white">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/dashboard")}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Send Money</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                  <span>Home</span>
                  <span>›</span>
                  <span className="text-gray-900">Send Money</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SendMoneyForm />
              <TransactionHistory />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}