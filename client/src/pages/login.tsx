import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AuthForm } from "@/components/auth-form";
import { isAuthenticated } from "@/lib/auth";
import { DollarSign } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      setLocation("/dashboard");
    }
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-800 rounded-2xl mb-4">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Remitro</h1>
          <p className="text-gray-600 mt-2">B2B Money Remittance Platform</p>
        </div>

        <div className="mb-6">
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setIsRegisterMode(false)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                !isRegisterMode
                  ? "bg-white shadow-sm text-primary-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsRegisterMode(true)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                isRegisterMode
                  ? "bg-white shadow-sm text-primary-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Register
            </button>
          </div>
        </div>

        <AuthForm isRegister={isRegisterMode} />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isRegisterMode ? "Already have an account?" : "New to Remitro?"}{" "}
            <button
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              {isRegisterMode ? "Sign in" : "Create business account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
