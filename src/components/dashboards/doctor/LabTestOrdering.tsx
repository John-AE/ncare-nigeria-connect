import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { TestTube, Plus, Loader2, Eye, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TestResultViewDialog } from "../laboratory/TestResultViewDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TestType {
  id: string;
  name: string;
  code: string;
  category: string;
  sample_type: string;
  price: number;
  turnaround_time_hours: number;
  preparation_instructions?: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth: string;
}

export const LabTestOrdering = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [priority, setPriority] = useState<"routine" | "urgent" | "stat">("routine");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Fetch available test types
  const { data: testTypes, isLoading: testTypesLoading } = useQuery({
    queryKey: ["lab-test-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lab_test_types")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("name");
      
      if (error) throw error;
      return data as TestType[];
    },
  });

  // Fetch all patients (simplified like Direct Patient Billing)
  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ["all-patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name, phone, date_of_birth")
        .order("first_name");
      
      if (error) throw error;
      return data as Patient[];
    },
  });

  // Fetch doctor's ordered tests
  const { data: orderedTests, isLoading: orderedTestsLoading } = useQuery({
    queryKey: ["doctor-lab-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lab_orders")
        .select(`
          *,
          patients(first_name, last_name),
          lab_test_types(name, code, sample_type),
          lab_results(id, result_value, result_status, is_abnormal, is_critical, reviewed_at)
        `)
        .eq("doctor_id", profile?.user_id)
        .order("order_date", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const groupedTests = testTypes?.reduce((acc, test) => {
    if (!acc[test.category]) {
      acc[test.category] = [];
    }
    acc[test.category].push(test);
    return acc;
  }, {} as Record<string, TestType[]>) || {};

  const handleTestToggle = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!selectedPatient || selectedTests.length === 0) {
      toast({
        title: "Error",
        description: "Please select a patient and at least one test",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create lab orders for each selected test
      const orders = selectedTests.map(testTypeId => ({
        patient_id: selectedPatient,
        doctor_id: profile?.user_id,
        test_type_id: testTypeId,
        hospital_id: profile?.hospital_id,
        ordered_by: profile?.user_id,
        priority,
        clinical_notes: clinicalNotes || null,
        status: "ordered",
      }));

      const { data: createdOrders, error } = await supabase
        .from("lab_orders")
        .insert(orders)
        .select("id");
      
      if (error) throw error;
      
      // Create bill for lab tests
      const totalCost = selectedTestsData.reduce((sum, test) => sum + test.price, 0);
      
      const { data: billData, error: billError } = await supabase
        .from("bills")
        .insert({
          patient_id: selectedPatient,
          lab_order_id: createdOrders[0].id,
          amount: totalCost,
          description: `Lab tests for ${selectedPatientData.first_name} ${selectedPatientData.last_name}`,
          bill_type: "lab_test",
          created_by: profile?.user_id,
          hospital_id: profile?.hospital_id,
        })
        .select()
        .single();
      
      if (billError) throw billError;
      
      // Create bill items
      const labBillItems = selectedTestsData.map(test => ({
        bill_id: billData.id,
        service_id: null,
        quantity: 1,
        unit_price: test.price,
        total_price: test.price,
      }));
      
      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(labBillItems);
      
      if (itemsError) throw itemsError;
      
      toast({
        title: "Success",
        description: `${selectedTests.length} lab test(s) ordered and billed successfully`,
      });

      // Reset form
      setSelectedPatient("");
      setSelectedTests([]);
      setClinicalNotes("");
      setPriority("routine");
      setIsDialogOpen(false);

      // Refresh relevant queries
      queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-lab-orders"] });
      
    } catch (error) {
      console.error("Error creating lab orders:", error);
      toast({
        title: "Error",
        description: "Failed to create lab orders",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "stat": return "bg-red-100 text-red-800";
      case "urgent": return "bg-yellow-100 text-yellow-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ordered": return "bg-gray-100 text-gray-800";
      case "sample_collected": return "bg-yellow-100 text-yellow-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const viewTestResult = async (order: any) => {
    if (order.lab_results?.length > 0) {
      // Fetch full result details
      const { data: result, error } = await supabase
        .from("lab_results")
        .select(`
          *,
          lab_orders(
            patients(first_name, last_name),
            lab_test_types(name, code, sample_type, normal_range)
          )
        `)
        .eq("id", order.lab_results[0].id)
        .single();
      
      if (!error && result) {
        setSelectedResult(result);
        setIsViewDialogOpen(true);
      }
    }
  };

  const selectedPatientData = patients?.find(p => p.id === selectedPatient);
  const selectedTestsData = testTypes?.filter(test => selectedTests.includes(test.id)) || [];
  const totalCost = selectedTestsData.reduce((sum, test) => sum + test.price, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Lab Test Ordering
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Order Tests
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Order Laboratory Tests</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Patient Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Patient</label>
                  <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Search and select any patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patientsLoading ? (
                        <SelectItem value="loading" disabled>Loading patients...</SelectItem>
                      ) : patients?.length === 0 ? (
                        <SelectItem value="no-patients" disabled>No patients found</SelectItem>
                      ) : (
                        patients?.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.first_name} {patient.last_name} - {patient.phone || 'No phone'}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Test Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Tests</label>
                  {testTypesLoading ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="text-sm text-muted-foreground mt-2">Loading test types...</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-60 overflow-y-auto border rounded-lg p-4">
                      {Object.entries(groupedTests).map(([category, tests]) => (
                        <div key={category}>
                          <h4 className="font-medium text-sm mb-2">{category}</h4>
                          <div className="grid gap-2">
                            {tests.map((test) => (
                              <div
                                key={test.id}
                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedTests.includes(test.id)
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                }`}
                                onClick={() => handleTestToggle(test.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-sm">{test.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {test.code} • {test.sample_type} • ₦{test.price.toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {test.turnaround_time_hours}h TAT
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Priority and Notes */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Priority</label>
                    <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="stat">STAT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Clinical Notes</label>
                    <Textarea
                      placeholder="Enter clinical notes or indications..."
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Order Summary */}
                {selectedPatientData && selectedTests.length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="font-medium mb-2">Order Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Patient:</span> {selectedPatientData.first_name} {selectedPatientData.last_name}
                      </div>
                      <div>
                        <span className="font-medium">Doctor:</span> Dr. {profile?.username}
                      </div>
                      <div>
                        <span className="font-medium">Tests ({selectedTests.length}):</span>
                        <div className="mt-1 space-y-1">
                          {selectedTestsData.map(test => (
                            <div key={test.id} className="flex justify-between text-xs">
                              <span>{test.name}</span>
                              <span>₦{test.price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-medium">
                          <span>Total Cost:</span>
                          <span>₦{totalCost.toLocaleString()}</span>
                        </div>
                      </div>
                      <div>
                        <Badge className={getPriorityColor(priority)}>
                          {priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedPatient || selectedTests.length === 0 || isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Order Tests
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-4 text-muted-foreground">
          <TestTube className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Click "Order Tests" to create new laboratory test orders</p>
        </div>
      </CardContent>
      
      {/* Ordered Tests List */}
      {orderedTests && orderedTests.length > 0 && (
        <CardContent className="pt-0">
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Recent Orders ({orderedTests.length})</h4>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {orderedTests.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium text-sm">
                          {order.patients?.first_name} {order.patients?.last_name}
                        </h5>
                        <Badge className={getPriorityColor(order.priority)} variant="secondary">
                          {order.priority}
                        </Badge>
                        <Badge className={getStatusColor(order.status)} variant="outline">
                          {order.status.replace("_", " ")}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>
                          <span className="font-medium">Test:</span> {order.lab_test_types?.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>
                            Ordered {formatDistanceToNow(new Date(order.order_date))} ago
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-3">
                      {order.status === "completed" && order.lab_results?.length > 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewTestResult(order)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Result
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Result
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
      
      <TestResultViewDialog
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        result={selectedResult}
      />
    </Card>
  );
};