import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Receipt, Calculator, Loader2 } from "lucide-react";

interface LabOrderWithDetails {
  id: string;
  patient_id: string;
  doctor_id: string;
  test_type_id: string;
  priority: string;
  status: string;
  order_date: string;
  clinical_notes?: string;
  patients: {
    first_name: string;
    last_name: string;
    phone?: string;
  };
  profiles: {
    username: string;
  };
  lab_test_types: {
    name: string;
    code: string;
    price: number;
    category: string;
    sample_type: string;
  };
}

export const TestOrderBilling = () => {
  const [selectedPatient, setSelectedPatient] = useState<string>("");

  // Fetch lab orders with patient and test details
  const { data: orders, isLoading } = useQuery({
    queryKey: ["lab-orders-billing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lab_orders")
        .select(`
          *,
          patients (
            first_name,
            last_name,
            phone
          ),
          profiles (
            username
          ),
          lab_test_types (
            name,
            code,
            price,
            category,
            sample_type
          )
        `)
        .in("status", ["ordered", "sample_collected", "in_progress"])
        .order("order_date", { ascending: false });

      if (error) throw error;
      return data as LabOrderWithDetails[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Group orders by patient
  const ordersByPatient = orders?.reduce((acc, order) => {
    const patientKey = `${order.patient_id}`;
    if (!acc[patientKey]) {
      acc[patientKey] = {
        patient: order.patients,
        orders: []
      };
    }
    acc[patientKey].orders.push(order);
    return acc;
  }, {} as Record<string, { patient: any; orders: LabOrderWithDetails[] }>) || {};

  const patientOptions = Object.entries(ordersByPatient).map(([patientId, data]) => ({
    id: patientId,
    name: `${data.patient.first_name} ${data.patient.last_name}`,
    phone: data.patient.phone,
    orders: data.orders
  }));

  const selectedPatientData = selectedPatient ? ordersByPatient[selectedPatient] : null;
  const selectedOrders = selectedPatientData?.orders || [];
  
  // Calculate totals
  const totalAmount = selectedOrders.reduce((sum, order) => sum + order.lab_test_types.price, 0);
  const testsByCategory = selectedOrders.reduce((acc, order) => {
    const category = order.lab_test_types.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(order);
    return acc;
  }, {} as Record<string, LabOrderWithDetails[]>);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "stat": return "bg-red-100 text-red-800";
      case "urgent": return "bg-yellow-100 text-yellow-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ordered": return "bg-blue-100 text-blue-800";
      case "sample_collected": return "bg-yellow-100 text-yellow-800";
      case "in_progress": return "bg-orange-100 text-orange-800";
      case "completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Test Order Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading billing data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Test Order Billing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Patient Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select Patient</label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a patient with pending orders" />
              </SelectTrigger>
              <SelectContent>
                {patientOptions.length === 0 ? (
                  <SelectItem value="no-patients" disabled>
                    No patients with pending orders
                  </SelectItem>
                ) : (
                  patientOptions.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} - {patient.orders.length} test(s)
                      {patient.phone && ` • ${patient.phone}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Billing Details */}
          {selectedPatientData && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {selectedPatientData.patient.first_name} {selectedPatientData.patient.last_name}
                  </h3>
                  {selectedPatientData.patient.phone && (
                    <p className="text-sm text-muted-foreground">
                      {selectedPatientData.patient.phone}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Tests</p>
                  <p className="text-2xl font-bold">{selectedOrders.length}</p>
                </div>
              </div>

              <Separator />

              {/* Tests by Category */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Test Breakdown
                </h4>
                
                {Object.entries(testsByCategory).map(([category, categoryOrders]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{category}</Badge>
                      <span className="text-sm text-muted-foreground">
                        ({categoryOrders.length} test{categoryOrders.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    
                    <div className="space-y-2 ml-4">
                      {categoryOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {order.lab_test_types.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {order.lab_test_types.code}
                              </Badge>
                              <Badge className={getPriorityColor(order.priority)}>
                                {order.priority}
                              </Badge>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Sample: {order.lab_test_types.sample_type} • 
                              Ordered by: Dr. {order.profiles.username} • 
                              Date: {new Date(order.order_date).toLocaleDateString()}
                            </div>
                            {order.clinical_notes && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Notes: {order.clinical_notes}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">
                              ₦{order.lab_test_types.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Total */}
              <div className="flex items-center justify-between py-2">
                <span className="text-lg font-semibold">Total Amount</span>
                <span className="text-2xl font-bold text-primary">
                  ₦{totalAmount.toLocaleString()}
                </span>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-2 bg-blue-50 rounded">
                  <p className="text-xs text-muted-foreground">Total Tests</p>
                  <p className="font-semibold">{selectedOrders.length}</p>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <p className="text-xs text-muted-foreground">Categories</p>
                  <p className="font-semibold">{Object.keys(testsByCategory).length}</p>
                </div>
                <div className="p-2 bg-purple-50 rounded">
                  <p className="text-xs text-muted-foreground">Avg. Cost</p>
                  <p className="font-semibold">
                    ₦{selectedOrders.length > 0 ? Math.round(totalAmount / selectedOrders.length).toLocaleString() : '0'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!selectedPatient && (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Select a patient to view their test order billing summary</p>
              <p className="text-sm mt-1">All pending test orders will be calculated</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};