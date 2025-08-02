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
import { TestTube, Plus, Loader2 } from "lucide-react";
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

  // Fetch patients from scheduled queue, triage queue, and today's appointments
  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ["available-patients"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get patients from appointments, vital signs (triage), and recent registrations
      const [appointmentsData, vitalsData, recentPatientsData] = await Promise.all([
        // Today's appointments
        supabase
          .from("appointments")
          .select(`
            patient_id,
            patients (
              id,
              first_name,
              last_name,
              phone,
              date_of_birth
            )
          `)
          .eq("scheduled_date", today)
          .in("status", ["scheduled", "in_progress"]),
        
        // Patients in triage (with recent vital signs)
        supabase
          .from("vital_signs")
          .select(`
            patient_id,
            patients (
              id,
              first_name,
              last_name,
              phone,
              date_of_birth
            )
          `)
          .gte("recorded_at", `${today}T00:00:00`)
          .order("recorded_at", { ascending: false }),
        
        // Recent patient registrations (today)
        supabase
          .from("patients")
          .select("id, first_name, last_name, phone, date_of_birth")
          .gte("created_at", `${today}T00:00:00`)
      ]);

      if (appointmentsData.error) throw appointmentsData.error;
      if (vitalsData.error) throw vitalsData.error;
      if (recentPatientsData.error) throw recentPatientsData.error;
      
      // Combine and deduplicate patients
      const allPatients: Patient[] = [
        // From appointments
        ...(appointmentsData.data?.filter(apt => apt.patients).map(apt => apt.patients) || []),
        // From vital signs (triage) - skip this for now due to relation issue
        // Recent registrations
        ...(recentPatientsData.data || [])
      ];
      
      // Remove duplicates
      const uniquePatients = allPatients.filter((patient, index, self) => 
        patient && index === self.findIndex(p => p?.id === patient?.id)
      );
      
      return uniquePatients;
    },
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

      const { error } = await supabase
        .from("lab_orders")
        .insert(orders);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedTests.length} lab test(s) ordered successfully`,
      });

      // Reset form
      setSelectedPatient("");
      setSelectedTests([]);
      setClinicalNotes("");
      setPriority("routine");
      setIsDialogOpen(false);

      // Refresh relevant queries
      queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
      
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
                      <SelectValue placeholder="Choose a patient from today's appointments" />
                    </SelectTrigger>
                    <SelectContent>
                      {patientsLoading ? (
                        <SelectItem value="loading" disabled>Loading patients...</SelectItem>
                      ) : patients?.length === 0 ? (
                        <SelectItem value="no-patients" disabled>No patients scheduled for today</SelectItem>
                      ) : (
                        patients?.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.first_name} {patient.last_name} - {patient.phone}
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
        <div className="text-center py-8 text-muted-foreground">
          <TestTube className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Click "Order Tests" to create new laboratory test orders</p>
          <p className="text-sm mt-1">Orders will appear in the Laboratory Test Queue</p>
        </div>
      </CardContent>
    </Card>
  );
};