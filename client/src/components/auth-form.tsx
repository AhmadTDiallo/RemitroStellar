import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { setAuthToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Send } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  terms: z.boolean().refine((val) => val === true, "You must agree to the terms"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface AuthFormProps {
  isRegister: boolean;
}

export function AuthForm({ isRegister }: AuthFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const schema = isRegister ? registerSchema : loginSchema;
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: isRegister 
      ? { name: "", email: "", password: "", confirmPassword: "", terms: false }
      : { email: "", password: "" },
  });

  const authMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = isRegister ? "/api/register" : "/api/login";
      const response = await apiRequest("POST", endpoint, data);
      return response.json();
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      toast({
        title: isRegister ? "Account created successfully!" : "Welcome back!",
        description: isRegister 
          ? "Your Stellar wallet has been created and is ready to use."
          : "You have been logged in successfully.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Authentication failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (isRegister) {
      const { confirmPassword, terms, ...registerData } = data;
      authMutation.mutate(registerData);
    } else {
      authMutation.mutate(data);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {isRegister && (
        <div>
          <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Business Name
          </Label>
          <Input
            id="name"
            {...form.register("name")}
            placeholder="Your Business Name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          />
          {form.formState.errors.name && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Business Email
        </Label>
        <Input
          id="email"
          type="email"
          {...form.register("email")}
          placeholder={isRegister ? "contact@yourcompany.com" : "your-business@company.com"}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
        />
        {form.formState.errors.email && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          {...form.register("password")}
          placeholder={isRegister ? "Create a strong password" : "Enter your password"}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
        />
        {form.formState.errors.password && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>
        )}
      </div>

      {isRegister && (
        <>
          <div>
            <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              {...form.register("confirmPassword")}
              placeholder="Confirm your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
            {form.formState.errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex items-start">
            <Checkbox
              id="terms"
              {...form.register("terms")}
              className="mt-1"
            />
            <Label htmlFor="terms" className="ml-2 text-sm text-gray-600">
              I agree to the{" "}
              <a href="#" className="text-primary-600 hover:text-primary-500">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary-600 hover:text-primary-500">
                Privacy Policy
              </a>
            </Label>
          </div>
          {form.formState.errors.terms && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.terms.message}</p>
          )}
        </>
      )}

      {!isRegister && (
        <div className="flex items-center justify-between">
          <Label className="flex items-center">
            <Checkbox className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span className="ml-2 text-sm text-gray-600">Remember me</span>
          </Label>
          <a href="#" className="text-sm text-primary-600 hover:text-primary-500">
            Forgot password?
          </a>
        </div>
      )}

      <Button
        type="submit"
        disabled={authMutation.isPending}
        className="w-full bg-primary-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-900 transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
      >
        {authMutation.isPending ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {isRegister ? <Building2 className="w-5 h-5" /> : <Send className="w-5 h-5" />}
            <span>
              {isRegister ? "Create Account & Setup Wallet" : "Sign In to Dashboard"}
            </span>
          </>
        )}
      </Button>
    </form>
  );
}
