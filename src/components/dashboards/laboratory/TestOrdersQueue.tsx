import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, AlertCircle, CreditCard } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EnterResultsDialog } from "./EnterResultsDialog";
import { toast } from "sonner";

export const TestOrdersQueue = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ["lab-orders-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lab_orders")
        .select(`
          *,
          patients(first_name, last_name),
          lab_test_types(name, code, sample_type, price),
          profiles(username),
          lab_samples(id, collected_at, sample_condition),
          bills!bills_lab_order_id_fkey(
            id,
            amount,
            amount_paid,
            bill_type,
            status
          )
        `)
        .in("status", ["ordered", "sample_collected", "in_progress"])
        .order("order_date", { ascending: true })
        .limit(20);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Helper function to check if bill is paid
  const isBillPaid = (order: any) => {
    if (!order.bills || order.bills.length === 0) {
      return false; // No bill created yet
    }
    
    const bill = order.bills[0];
    return bill.amount_paid >= bill.amount;
  };

  // Helper function to get payment status
  const getPaymentStatus = (order: any) => {
    if (!order.bills || order.bills.length === 0) {
      return { status: "no_bill", text: "No Bill", color: "bg-gray-100 text-gray-800" };
    }
    
    const bill = order.bills[0];
    if (bill.amount_paid >= bill.amount) {
      return { status: "paid", text: "Paid", color: "bg-green-100 text-green-800" };
    } else if (bill.amount_paid > 0) {
      return { status: "partial", text: "Partial", color: "bg-yellow-100 text-yellow-800" };
    } else {
      return { status: "unpaid", text: "Unpaid", color: "bg-red-100 text-red-800" };
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, order: any) => {
    // Check payment status before allowing progression
    if (newStatus === "sample_collected" || newStatus === "in_progress") {
      if (!isBillPaid(order)) {
        toast.error("Cannot proceed: Lab test bill must be paid first", {
          description: "Please ensure the patient pays the bill at the finance unit before collecting sample or starting test."
        });
        return;
      }
    }

    const { error } = await supabase
      .from("lab_orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order status", {
        description: error.message
      });
      return;
    }

    toast.success(`Order status updated to ${newStatus.replace("_", " ")}`, {
      description: "The lab order queue has been refreshed."
    });
    
    refetch();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "stat":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ordered":
        return "bg-gray-100 text-gray-800";
      case "sample_collected":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Orders Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Test Orders Queue ({orders?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {orders?.map((order) => {
            const paymentStatus = getPaymentStatus(order);
            const isPaid = isBillPaid(order);
            
            return (
              <div
                key={order.id}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  !isPaid ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">
                        {order.patients?.first_name} {order.patients?.last_name}
                      </h4>
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority}
                      </Badge>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.replace("_", " ")}
                      </Badge>
                      <Badge className={paymentStatus.color} variant="outline">
                        <CreditCard className="h-3 w-3 mr-1" />
                        {paymentStatus.text}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Test:</span>
                        {order.lab_test_types?.name} ({order.lab_test_types?.code})
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Cost:</span>
                        ₦{order.lab_test_types?.price?.toLocaleString() || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Dr. {order.profiles?.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          Ordered {formatDistanceToNow(new Date(order.order_date))} ago
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Sample:</span> {order.lab_test_types?.sample_type}
                      </div>
                      {order.clinical_notes && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5" />
                          <span className="text-xs">{order.clinical_notes}</span>
                        </div>
                      )}
                      
                      {/* Payment warning */}
                      {!isPaid && (
                        <div className="flex items-start gap-2 p-2 bg-red-100 rounded-lg mt-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 text-red-600" />
                          <span className="text-xs text-red-800">
                            <strong>Payment Required:</strong> Patient must pay the lab test bill at the finance unit before sample collection can begin.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    {order.status === "ordered" && (
                      <Button
                        size="sm"
                        disabled={!isPaid}
                        onClick={() => updateOrderStatus(order.id, "sample_collected", order)}
                        className={!isPaid ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        {isPaid ? "Mark Collected" : "Payment Required"}
                      </Button>
                    )}
                    {order.status === "sample_collected" && (
                      <Button
                        size="sm"
                        disabled={!isPaid}
                        onClick={() => updateOrderStatus(order.id, "in_progress", order)}
                        className={!isPaid ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        {isPaid ? "Start Testing" : "Payment Required"}
                      </Button>
                    )}
                    {order.status === "in_progress" && isPaid && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsResultDialogOpen(true);
                        }}
                      >
                        Enter Results
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {!orders?.length && (
            <div className="text-center py-8 text-muted-foreground">
              No pending orders in queue
            </div>
          )}
        </div>
      </CardContent>
      
      <EnterResultsDialog
        isOpen={isResultDialogOpen}
        onClose={() => setIsResultDialogOpen(false)}
        order={selectedOrder}
        onResultSubmitted={refetch}
      />
    </Card>
  );
};