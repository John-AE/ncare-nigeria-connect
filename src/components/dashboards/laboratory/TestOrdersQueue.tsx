import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EnterResultsDialog } from "./EnterResultsDialog";

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
          lab_test_types(name, code, sample_type),
          profiles(username),
          lab_samples(id, collected_at, sample_condition)
        `)
        .in("status", ["ordered", "sample_collected", "in_progress"])
        .order("order_date", { ascending: true })
        .limit(20);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("lab_orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (!error) {
      refetch();
    }
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
          {orders?.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
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
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Test:</span>
                      {order.lab_test_types?.name} ({order.lab_test_types?.code})
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
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  {order.status === "ordered" && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, "sample_collected")}
                    >
                      Mark Collected
                    </Button>
                  )}
                  {order.status === "sample_collected" && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, "in_progress")}
                    >
                      Start Testing
                    </Button>
                  )}
                  {order.status === "in_progress" && (
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
          ))}
          
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