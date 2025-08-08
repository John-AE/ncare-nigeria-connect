import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Eye, CheckCircle, Pill, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";

interface CompletedVisit {
  id: string;
  patient_id: string;
  patient_name: string;
  complaints: string;
  diagnosis: string;
  treatment_plan: string;
  prescriptions: string;
  visit_date: string;
  visit_time: string;
  medications: Array<{
    id: string;
    name: string;
    quantity: number;
    unit_price: number;
  }>;
  labTests: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  dispensed: boolean;
}

export const EnhancedCompletedConsultations = () => {
  const [completedVisits, setCompletedVisits] = useState<CompletedVisit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<CompletedVisit | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDispensing, setIsDispensing] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    const fetchCompletedVisits = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch visits first
        const { data: visitsData, error: visitsError } = await supabase
          .from('visits')
          .select(`
            id,
            complaints,
            diagnosis,
            treatment_plan,
            prescriptions,
            visit_date,
            visit_time,
            patient_id,
            patients!inner(first_name, last_name)
          `)
          .eq('visit_date', today)
          .order('created_at', { ascending: false });

        if (visitsError) throw visitsError;

        if (!visitsData || visitsData.length === 0) {
          setCompletedVisits([]);
          return;
        }

        const visitIds = visitsData.map(v => v.id);
        
        // Fetch prescriptions for these visits
        const { data: prescriptionsData } = await supabase
          .from('prescriptions')
          .select(`
            visit_id,
            service_id,
            quantity,
            services(name, price)
          `)
          .in('visit_id', visitIds);

        // Fetch lab orders for these visits
        const { data: labOrdersData } = await supabase
          .from('lab_orders')
          .select(`
            visit_id,
            id,
            status,
            lab_test_types(name)
          `)
          .in('visit_id', visitIds);

        // Check which visits have been dispensed
        const { data: dispensingData } = await supabase
          .from('medication_dispensing')
          .select('visit_id')
          .in('visit_id', visitIds);

        const dispensedVisitIds = new Set(dispensingData?.map(d => d.visit_id) || []);

        // Group prescriptions and lab orders by visit_id
        const prescriptionsByVisit = new Map();
        prescriptionsData?.forEach(p => {
          if (!prescriptionsByVisit.has(p.visit_id)) {
            prescriptionsByVisit.set(p.visit_id, []);
          }
          prescriptionsByVisit.get(p.visit_id).push(p);
        });

        const labOrdersByVisit = new Map();
        labOrdersData?.forEach(l => {
          if (!labOrdersByVisit.has(l.visit_id)) {
            labOrdersByVisit.set(l.visit_id, []);
          }
          labOrdersByVisit.get(l.visit_id).push(l);
        });

        const formattedVisits = visitsData.map(visit => ({
          id: visit.id,
          patient_id: visit.patient_id,
          patient_name: `${visit.patients.first_name} ${visit.patients.last_name}`,
          complaints: visit.complaints || '',
          diagnosis: visit.diagnosis || '',
          treatment_plan: visit.treatment_plan || '',
          prescriptions: visit.prescriptions || '',
          visit_date: visit.visit_date,
          visit_time: visit.visit_time,
          medications: prescriptionsByVisit.get(visit.id)?.map(p => ({
            id: p.service_id,
            name: p.services?.name || '',
            quantity: p.quantity,
            unit_price: p.services?.price || 0
          })) || [],
          labTests: labOrdersByVisit.get(visit.id)?.map(l => ({
            id: l.id,
            name: l.lab_test_types?.name || '',
            status: l.status
          })) || [],
          dispensed: dispensedVisitIds.has(visit.id)
        }));

        setCompletedVisits(formattedVisits);
      } catch (error) {
        console.error('Error fetching completed visits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedVisits();

    // Set up real-time listener for new visits
    const channel = supabase
      .channel('completed-visits-pharmacy')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'visits' },
        () => {
          fetchCompletedVisits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleMarkAsDispensed = async () => {
    if (!selectedVisit || !profile) return;

    setIsDispensing(true);
    try {
      // Create dispensing records for each medication
      const dispensingRecords = selectedVisit.medications.map(med => ({
        medication_id: med.id,
        patient_id: selectedVisit.patient_id,
        visit_id: selectedVisit.id,
        inventory_id: med.id, // This should be proper inventory_id from medication_inventory table
        quantity_dispensed: med.quantity,
        dispensed_by: profile.user_id,
        hospital_id: profile.hospital_id,
        notes: `Dispensed for visit ${selectedVisit.id}`
      }));

      if (dispensingRecords.length > 0) {
        const { error } = await supabase
          .from('medication_dispensing')
          .insert(dispensingRecords);

        if (error) throw error;
      }

      // Update local state
      setCompletedVisits(prev => prev.map(visit => 
        visit.id === selectedVisit.id 
          ? { ...visit, dispensed: true }
          : visit
      ));

      setSelectedVisit(prev => prev ? { ...prev, dispensed: true } : null);

      toast({
        title: "Success",
        description: "Medications dispensed successfully!",
      });
    } catch (error) {
      console.error('Error marking as dispensed:', error);
      toast({
        title: "Error",
        description: "Failed to mark as dispensed",
        variant: "destructive"
      });
    } finally {
      setIsDispensing(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-l-8 border-l-[#65A30D]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Doctor Consultation Completed
            <Badge variant="outline" className="ml-auto">
              {completedVisits.length} patients
            </Badge>
          </CardTitle>
          <CardDescription>Recently completed patient consultations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-l-8 border-l-[#65A30D]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Doctor Consultation Completed
            <Badge variant="outline" className="ml-auto">
              {completedVisits.length} patients
            </Badge>
          </CardTitle>
          <CardDescription>Recently completed patient consultations with medications and lab tests</CardDescription>
        </CardHeader>
        <CardContent>
          {completedVisits.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No completed consultations today
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {completedVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedVisit(visit)}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-foreground">{visit.patient_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {visit.visit_time} - {visit.visit_date}
                      </p>
                      <div className="flex gap-2 mt-1">
                        {visit.medications.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <Pill className="h-3 w-3 mr-1" />
                            {visit.medications.length} meds
                          </Badge>
                        )}
                        {visit.labTests.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <TestTube className="h-3 w-3 mr-1" />
                            {visit.labTests.length} tests
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {visit.dispensed ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Dispensed
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedVisit} onOpenChange={() => setSelectedVisit(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visit Details - {selectedVisit?.patient_name}</DialogTitle>
            <DialogDescription>
              Consultation completed on {selectedVisit?.visit_date} at {selectedVisit?.visit_time}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVisit && (
            <div className="space-y-6">
              {/* Basic Visit Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Patient Complaints</Label>
                  <Textarea
                    value={selectedVisit.complaints}
                    readOnly
                    rows={2}
                    className="mt-1 bg-muted resize-none"
                    placeholder="No complaints recorded"
                  />
                </div>
                
                <div>
                  <Label>Diagnosis</Label>
                  <Textarea
                    value={selectedVisit.diagnosis}
                    readOnly
                    rows={2}
                    className="mt-1 bg-muted resize-none"
                    placeholder="No diagnosis recorded"
                  />
                </div>
              </div>

              <div>
                <Label>Treatment Plan / Lab work Requisition</Label>
                <Textarea
                  value={selectedVisit.treatment_plan}
                  readOnly
                  rows={2}
                  className="mt-1 bg-muted resize-none"
                  placeholder="No treatment plan recorded"
                />
              </div>

              {/* Medications Section */}
              <div>
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medications to Dispense
                </Label>
                {selectedVisit.medications.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {selectedVisit.medications.map((med, index) => (
                      <div key={med.id} className="p-3 border rounded-lg bg-blue-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{med.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {med.quantity} | Unit Price: ₦{med.unit_price.toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="outline">
                            Total: ₦{(med.quantity * med.unit_price).toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-2">No medications prescribed</p>
                )}
              </div>

              {/* Lab Tests Section */}
              <div>
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Laboratory Tests Ordered
                </Label>
                {selectedVisit.labTests.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {selectedVisit.labTests.map((test, index) => (
                      <div key={test.id} className="p-3 border rounded-lg bg-yellow-50">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">{test.name}</p>
                          <Badge variant={test.status === 'completed' ? 'default' : 'secondary'}>
                            {test.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-2">No lab tests ordered</p>
                )}
              </div>

              {/* Dispensing Action */}
              {selectedVisit.medications.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      id="dispensed" 
                      checked={selectedVisit.dispensed}
                      disabled={selectedVisit.dispensed}
                    />
                    <Label 
                      htmlFor="dispensed" 
                      className={selectedVisit.dispensed ? "text-green-600" : ""}
                    >
                      {selectedVisit.dispensed ? "Medications have been dispensed" : "Mark as dispensed after giving medications to patient"}
                    </Label>
                  </div>
                  {!selectedVisit.dispensed && (
                    <Button 
                      onClick={handleMarkAsDispensed}
                      disabled={isDispensing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isDispensing ? "Processing..." : "Mark as Dispensed"}
                    </Button>
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