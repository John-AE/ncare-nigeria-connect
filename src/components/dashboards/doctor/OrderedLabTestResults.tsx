import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { TestTube, Eye, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface LabTestOrder {
  id: string;
  patient_name: string;
  test_name: string;
  status: string;
  order_date: string;
  priority: string;
  result_status?: string;
  result_value?: string;
  comments?: string;
  reference_range?: string;
  is_critical?: boolean;
  tested_at?: string;
  reviewed_at?: string;
}

export const OrderedLabTestResults = () => {
  const [labOrders, setLabOrders] = useState<LabTestOrder[]>([]);
  const [selectedResult, setSelectedResult] = useState<LabTestOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    const fetchLabOrders = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('lab_orders')
          .select(`
            id,
            status,
            order_date,
            priority,
            patients!inner(first_name, last_name),
            lab_test_types!inner(name),
            lab_results(
              result_status,
              result_value,
              comments,
              reference_range,
              is_critical,
              tested_at,
              reviewed_at
            )
          `)
          .eq('doctor_id', profile?.user_id)
          .gte('order_date', today)
          .order('order_date', { ascending: false });

        if (error) throw error;

        const formattedOrders = data.map(order => ({
          id: order.id,
          patient_name: `${order.patients.first_name} ${order.patients.last_name}`,
          test_name: order.lab_test_types.name,
          status: order.status,
          order_date: order.order_date,
          priority: order.priority,
          result_status: order.lab_results?.[0]?.result_status,
          result_value: order.lab_results?.[0]?.result_value,
          comments: order.lab_results?.[0]?.comments,
          reference_range: order.lab_results?.[0]?.reference_range,
          is_critical: order.lab_results?.[0]?.is_critical,
          tested_at: order.lab_results?.[0]?.tested_at,
          reviewed_at: order.lab_results?.[0]?.reviewed_at,
        }));

        setLabOrders(formattedOrders);
      } catch (error) {
        console.error('Error fetching lab orders:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.user_id) {
      fetchLabOrders();
    }

    // Set up real-time listener for lab results updates
    const channel = supabase
      .channel('lab-results-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'lab_results' },
        () => {
          fetchLabOrders();
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'lab_orders' },
        () => {
          fetchLabOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id]);

  const getStatusBadge = (status: string, resultStatus?: string, isCritical?: boolean) => {
    if (resultStatus === 'completed') {
      return (
        <Badge className={isCritical ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
          <CheckCircle className="h-3 w-3 mr-1" />
          {isCritical ? "Critical Result" : "Complete"}
        </Badge>
      );
    }
    
    switch (status) {
      case 'ordered':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Ordered
          </Badge>
        );
      case 'sample_collected':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <TestTube className="h-3 w-3 mr-1" />
            Sample Collected
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card className="border-l-8 border-l-[#F42C04]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Ordered Lab Test Results
            <Badge variant="outline" className="ml-auto">
              {labOrders.length} tests
            </Badge>
          </CardTitle>
          <CardDescription>Track status and view results of lab tests you ordered today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-l-8 border-l-[#F42C04]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Ordered Lab Test Results
            <Badge variant="outline" className="ml-auto">
              {labOrders.length} tests
            </Badge>
          </CardTitle>
          <CardDescription>Track status and view results of lab tests you ordered today</CardDescription>
        </CardHeader>
        <CardContent>
          {labOrders.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No lab tests ordered today
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {labOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-foreground">{order.patient_name}</p>
                        <p className="text-sm text-muted-foreground">{order.test_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Ordered: {new Date(order.order_date).toLocaleDateString()}
                          {order.priority === 'urgent' && (
                            <Badge variant="destructive" className="ml-2 text-xs">Urgent</Badge>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.status, order.result_status, order.is_critical)}
                    {order.result_status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedResult(order)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Result
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lab Test Result - {selectedResult?.patient_name}</DialogTitle>
            <DialogDescription>
              {selectedResult?.test_name} - Ordered on {selectedResult?.order_date && new Date(selectedResult.order_date).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          
          {selectedResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Test Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedResult.status, selectedResult.result_status, selectedResult.is_critical)}
                  </div>
                </div>
                
                <div>
                  <Label>Priority</Label>
                  <div className="mt-1">
                    <Badge variant={selectedResult.priority === 'urgent' ? 'destructive' : 'secondary'}>
                      {selectedResult.priority}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedResult.result_value && (
                <div>
                  <Label>Result Value</Label>
                  <Textarea
                    value={selectedResult.result_value}
                    readOnly
                    rows={2}
                    className="mt-1 bg-muted resize-none"
                  />
                </div>
              )}

              {selectedResult.reference_range && (
                <div>
                  <Label>Reference Range</Label>
                  <Textarea
                    value={selectedResult.reference_range}
                    readOnly
                    rows={1}
                    className="mt-1 bg-muted resize-none"
                  />
                </div>
              )}

              {selectedResult.comments && (
                <div>
                  <Label>Comments</Label>
                  <Textarea
                    value={selectedResult.comments}
                    readOnly
                    rows={3}
                    className="mt-1 bg-muted resize-none"
                  />
                </div>
              )}

              {selectedResult.tested_at && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <Label>Tested At</Label>
                    <p className="mt-1">{new Date(selectedResult.tested_at).toLocaleString()}</p>
                  </div>
                  {selectedResult.reviewed_at && (
                    <div>
                      <Label>Reviewed At</Label>
                      <p className="mt-1">{new Date(selectedResult.reviewed_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};