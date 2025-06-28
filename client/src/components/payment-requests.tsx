import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Receipt, DollarSign, Clock, CheckCircle } from "lucide-react";

interface PaymentRequest {
  id: number;
  fromBusinessId: number;
  toBusinessId: number;
  amount: string;
  memo: string | null;
  status: string;
  transactionId: number | null;
  createdAt: string;
  fromBusinessName: string;
  fromBusinessEmail: string;
}

export function PaymentRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: paymentRequests = [], isLoading } = useQuery<PaymentRequest[]>({
    queryKey: ["/api/payment-requests"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const payRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest("POST", `/api/payment-requests/${requestId}/pay`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment sent successfully!",
        description: "The payment request has been fulfilled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePayRequest = (requestId: number) => {
    payRequestMutation.mutate(requestId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-orange-600 border-orange-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "paid":
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-red-600 border-red-600">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Payment Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading payment requests...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Payment Requests
        </CardTitle>
        <CardDescription>
          Requests for payment from other businesses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paymentRequests.length === 0 ? (
          <p className="text-gray-500">No payment requests received.</p>
        ) : (
          <div className="space-y-4">
            {paymentRequests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{request.fromBusinessName}</h4>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-gray-600">{request.fromBusinessEmail}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-lg font-semibold">
                      <DollarSign className="w-4 h-4" />
                      {parseFloat(request.amount).toFixed(7)} XLM
                    </div>
                  </div>
                </div>

                {request.memo && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm">
                      <strong>Memo:</strong> {request.memo}
                    </p>
                  </div>
                )}

                {request.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handlePayRequest(request.id)}
                      disabled={payRequestMutation.isPending}
                      className="flex-1"
                    >
                      {payRequestMutation.isPending ? "Processing..." : "Pay Request"}
                    </Button>
                  </div>
                )}

                {request.status === "paid" && request.transactionId && (
                  <div className="text-sm text-green-600">
                    ✓ Paid via transaction #{request.transactionId}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}