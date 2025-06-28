import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, AlertTriangle } from "lucide-react";

const sendSchema = z.object({
  destinationAddress: z
    .string()
    .min(56, "Invalid Stellar address")
    .max(56, "Invalid Stellar address")
    .regex(/^G[A-Z0-9]{55}$/, "Invalid Stellar address format"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d{1,7})?$/, "Invalid amount format"),
  memo: z.string().optional(),
});

export function SendMoneyForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(sendSchema),
    defaultValues: {
      destinationAddress: "",
      amount: "",
      memo: "",
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (data: z.infer<typeof sendSchema>) => {
      const response = await apiRequest("POST", "/api/send", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Transaction sent successfully!",
        description: `Transaction hash: ${data.stellarTxHash}`,
      });
      form.reset();
      // Invalidate profile to refresh balance
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      // Invalidate transactions to show new transaction
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Transaction failed",
        description: error.message || "Please check your input and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof sendSchema>) => {
    sendMutation.mutate(data);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <Send className="w-6 h-6 text-primary-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Send XLM</h3>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="destinationAddress" className="block text-sm font-medium text-gray-700 mb-2">
            Destination Address
          </Label>
          <Input
            id="destinationAddress"
            {...form.register("destinationAddress")}
            placeholder="G..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors font-mono text-sm"
          />
          {form.formState.errors.destinationAddress && (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.destinationAddress.message}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Enter the recipient's Stellar wallet address
          </p>
        </div>

        <div>
          <Label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount (XLM)
          </Label>
          <div className="relative">
            <Input
              id="amount"
              type="text"
              {...form.register("amount")}
              placeholder="0.0000000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors pr-16"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
              <span className="text-gray-500 text-sm font-medium">XLM</span>
            </div>
          </div>
          {form.formState.errors.amount && (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.amount.message}
            </p>
          )}
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Min: 0.0000001 XLM</span>
            <span>Network: Stellar Testnet</span>
          </div>
        </div>

        <div>
          <Label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-2">
            Memo (Optional)
          </Label>
          <Input
            id="memo"
            {...form.register("memo")}
            placeholder="Payment reference..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          />
          {form.formState.errors.memo && (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.memo.message}
            </p>
          )}
        </div>

        <Alert className="bg-yellow-50 border border-yellow-200">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div>
              <h4 className="font-medium">Testnet Transaction</h4>
              <p className="text-xs mt-1">
                This will send testnet XLM. No real money will be transferred.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <Button
          type="submit"
          disabled={sendMutation.isPending}
          className="w-full bg-primary-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-900 transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
        >
          {sendMutation.isPending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Send XLM</span>
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
