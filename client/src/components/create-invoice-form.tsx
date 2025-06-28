import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { createInvoiceSchema, type CreateInvoiceData } from "@shared/schema";
import { Receipt } from "lucide-react";

export function CreateInvoiceForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateInvoiceData>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      toBusinessEmail: "",
      amount: "",
      memo: "",
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: CreateInvoiceData) => {
      const response = await apiRequest("POST", "/api/invoices", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invoice created successfully!",
        description: "The payment request has been sent to the recipient.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/payment-requests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateInvoiceData) => {
    createInvoiceMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Create Invoice
        </CardTitle>
        <CardDescription>
          Request payment from another Remitro business account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="toBusinessEmail">Business Email</Label>
            <Input
              id="toBusinessEmail"
              type="email"
              placeholder="Enter business email address"
              {...form.register("toBusinessEmail")}
            />
            {form.formState.errors.toBusinessEmail && (
              <p className="text-sm text-red-500">
                {form.formState.errors.toBusinessEmail.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (XLM)</Label>
            <Input
              id="amount"
              type="text"
              placeholder="0.0000000"
              {...form.register("amount")}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-red-500">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">Memo (Optional)</Label>
            <Textarea
              id="memo"
              placeholder="Invoice description or note"
              {...form.register("memo")}
            />
            {form.formState.errors.memo && (
              <p className="text-sm text-red-500">
                {form.formState.errors.memo.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createInvoiceMutation.isPending}
          >
            {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}