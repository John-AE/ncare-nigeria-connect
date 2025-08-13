import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TestTube2, Plus, Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";

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
  email: string;
}

export const DirectLabTestOrdering = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Patient search state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Test ordering state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const searchPatients = async (searchValue: string) => {
    if (searchValue.length < 2) {
      setPatients([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email')
        .eq('hospital_id', profile?.hospital_id)
        .or(`first_name.ilike.%${searchValue}%,last_name.ilike.%${searchValue}%`)
        .limit(10);

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  };

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
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient",
        variant: "destructive",
      });
      return;
    }

    if (selectedTests.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one test",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the lab orders - bills will be automatically created by the database trigger
      const orders = selectedTests.map(testTypeId => ({
        patient_id: selectedPatient.id,
        doctor_id: profile?.user_id,
        test_type_id: testTypeId,
        hospital_id: profile?.hospital_id,
        ordered_by: profile?.user_id,
        priority,
        clinical_notes: clinicalNotes || null,
        status: "ordered",
      }));

      const { error: orderError } = await supabase
        .from("lab_orders")
        .insert(orders);

      if (orderError) throw orderError;

      toast({
        title: "Success",
        description: `${selectedTests.length} lab test(s) ordered successfully for ${selectedPatient.first_name} ${selectedPatient.last_name}`,
      });

      // Reset form completely
      setSelectedPatient(null);
      setSelectedTests([]);
      setClinicalNotes("");
      setPriority("routine");
      setSearchTerm('');
      setPatients([]);
      setIsDialogOpen(false);

      // Refresh lab orders to update OrderedLabTestResults
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

  const selectedTestsData = testTypes?.filter(test => selectedTests.includes(test.id)) || [];
  const totalCost = selectedTestsData.reduce((sum, test) => sum + test.price, 0);

  return (
    <Card className="border-l-8 border-l-[#00D2FF]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube2 className="h-5 w-5" />
          Direct Lab Test Ordering
        </CardTitle>
        <CardDescription>
          Order lab tests for any patient without appointments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Patient Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Patient</label>
          <Select
            value={selectedPatient?.id || ''}
            onValueChange={(patientId) => {
              const patient = patients.find(p => p.id === patientId);
              setSelectedPatient(patient || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Search and select patient">
                {selectedPatient ? (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </div>
                ) : (
                  "Search and select patient"
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Type patient name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    searchPatients(e.target.value);
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              {patients.map(patient => (
                <SelectItem key={patient.id} value={patient.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {patient.first_name} {patient.last_name}
                    {patient.email && (
                      <span className="text-xs text-muted-foreground">({patient.email})</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPatient && (
          <div className="flex justify-center">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Order Tests for {selectedPatient.first_name} {selectedPatient.last_name}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Order Laboratory Tests for {selectedPatient.first_name} {selectedPatient.last_name}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
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
                  {selectedTests.length > 0 && (
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h4 className="font-medium mb-2">Order Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Patient:</span> {selectedPatient.first_name} {selectedPatient.last_name}
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
                      disabled={selectedTests.length === 0 || isSubmitting}
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
        )}
      </CardContent>
    </Card>
  );
};