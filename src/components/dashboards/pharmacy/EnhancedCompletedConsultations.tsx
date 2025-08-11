import { useState, useEffect, useCallback } from "react";
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
import { useUnifiedRefresh } from "@/hooks/useUnifiedRefresh";
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

interface EnhancedCompletedConsultationsProps {
  refreshTrigger?: (fn: () => void) => void;
}

export const EnhancedCompletedConsultations = ({ refreshTrigger }: EnhancedCompletedConsultationsProps) => {
  const [completedVisits, setCompletedVisits] = useState<CompletedVisit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<CompletedVisit | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDispensing, setIsDispensing] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const fetchCompletedVisits = useCallback(async () => {
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
        const patientIds = visitsData.map(v => v.patient_id);
        
        // Fetch prescriptions for these visits (services-based meds)
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
            patient_id,
            id,
            status,
            lab_test_types(name)
          `)
          .in('visit_id', visitIds);
        
        // Fetch bills for these patients today (to capture MedicationSelector items)
        const dayStart = `${today}T00:00:00.000Z`;
        const dayEnd = `${today}T23:59:59.999Z`;
        const { data: billsData } = await supabase
          .from('bills')
          .select('id, patient_id, created_at')
          .in('patient_id', patientIds)
          .gte('created_at', dayStart)
          .lt('created_at', dayEnd);
        
        const billIds = (billsData || []).map(b => b.id);
        
        // Pull medication bill items (MedicationSelector writes to bill_items with medication_id)
        const { data: billItemsData } = billIds.length
          ? await supabase
              .from('bill_items')
              .select('bill_id, medication_id, quantity, unit_price, total_price')
              .in('bill_id', billIds)
              .not('medication_id', 'is', null)
          : { data: [], error: null } as any;

        // Also include lab orders created today that may not be linked to a visit but belong to these patients
        const { data: patientLabOrdersData } = await supabase
          .from('lab_orders')
          .select(`
            visit_id,
            patient_id,
            id,
            status,
            lab_test_types(name)
          `)
          .is('visit_id', null)
          .in('patient_id', patientIds)
          .gte('order_date', dayStart)
          .lt('order_date', dayEnd);

        const combinedLabOrdersData = [
          ...(labOrdersData || []),
          ...(patientLabOrdersData || []),
        ];
        
        // Resolve medication names with strict typing
        const medicationIds = Array.from(
          new Set((billItemsData || []).map((bi: any) => bi.medication_id))
        ).filter((id: any): id is string => typeof id === 'string');
        const { data: medsData } = medicationIds.length
          ? await supabase
              .from('medications')
              .select('id, name')
              .in('id', medicationIds as string[])
          : { data: [], error: null } as any;
        const medNameById = new Map<string, string>((medsData || []).map((m: any) => [m.id as string, m.name as string]));
        
        // Group medication bill items by patient via their bill
        const billsById = new Map((billsData || []).map(b => [b.id, b]));
        const medsByPatient = new Map<string, Array<{ id: string; name: string; quantity: number; unit_price: number }>>();
        (billItemsData || []).forEach((bi: any) => {
          const bill = billsById.get(bi.bill_id);
          if (!bill) return;
          const arr = medsByPatient.get(bill.patient_id) || [];
          arr.push({
            id: bi.medication_id,
            name: medNameById.get(bi.medication_id) || 'Medication',
            quantity: bi.quantity || 0,
            unit_price: Number(bi.unit_price) || 0,
          });
          medsByPatient.set(bill.patient_id, arr);
        });
        
        // Group prescriptions and lab orders by visit_id
        const prescriptionsByVisit = new Map();
        prescriptionsData?.forEach(p => {
          if (!prescriptionsByVisit.has(p.visit_id)) {
            prescriptionsByVisit.set(p.visit_id, []);
          }
          prescriptionsByVisit.get(p.visit_id).push(p);
        });
        
        const labOrdersByVisit = new Map<string, any[]>();
        (combinedLabOrdersData || []).forEach((l: any) => {
          // If order isn't linked to a visit, attach to today's visit for the same patient
          let vId = l.visit_id as string | null;
          if (!vId) {
            const v = visitsData.find((vv: any) => vv.patient_id === l.patient_id);
            vId = v?.id || null;
          }
          if (!vId) return;
          if (!labOrdersByVisit.has(vId)) {
            labOrdersByVisit.set(vId, []);
          }
          labOrdersByVisit.get(vId)!.push(l);
        });
        
        const formattedVisits = visitsData.map(visit => {
          const medsFromPrescriptions = (prescriptionsByVisit.get(visit.id) || []).map((p: any) => ({
            id: p.service_id,
            name: p.services?.name || '',
            quantity: p.quantity,
            unit_price: p.services?.price || 0,
          }));
          const medsFromBillItems = medsByPatient.get(visit.patient_id) || [];
          return {
            id: visit.id,
            patient_id: visit.patient_id,
            patient_name: `${visit.patients.first_name} ${visit.patients.last_name}`,
            complaints: visit.complaints || '',
            diagnosis: visit.diagnosis || '',
            treatment_plan: visit.treatment_plan || '',
            prescriptions: visit.prescriptions || '',
            visit_date: visit.visit_date,
            visit_time: visit.visit_time,
            medications: [...medsFromPrescriptions, ...medsFromBillItems],
            labTests: (labOrdersByVisit.get(visit.id) || []).map((l: any) => ({
              id: l.id,
              name: l.lab_test_types?.name || '',
              status: l.status,
            })),
            dispensed: false, // Will be set below
          } as CompletedVisit;
        });

        // Check which visits have been dispensed
        const { data: dispensingData } = await supabase
          .from('medication_dispensing')
          .select('visit_id')
          .in('visit_id', visitIds);

        // Get visits that either have dispensing records OR have no medications at all
        const visitsWithMeds = new Set();
        formattedVisits.forEach(v => {
          if (v.medications.length > 0) visitsWithMeds.add(v.id);
        });

        const dispensedVisitIds = new Set([
          ...(dispensingData?.map(d => d.visit_id) || []),
          ...visitIds.filter(id => !visitsWithMeds.has(id))
        ]);

        // Update dispensed status
        formattedVisits.forEach(visit => {
          visit.dispensed = dispensedVisitIds.has(visit.id);
        });
        
        setCompletedVisits(formattedVisits);
      } catch (error) {
        console.error('Error fetching completed visits:', error);
      } finally {
        setLoading(false);
      }
    }, [profile?.hospital_id]);

  // Use unified refresh hook
  useUnifiedRefresh(refreshTrigger, fetchCompletedVisits);

  useEffect(() => {
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
  }, [fetchCompletedVisits]);

const handleMarkAsDispensedForVisit = async (visit: CompletedVisit) => {
  if (!visit || !profile) return;

  setIsDispensing(true);

  // Optimistic update
  setCompletedVisits(prev => prev.map(v => 
    v.id === visit.id ? { ...v, dispensed: true } : v
  ));

  try {
    // Use all medications
    const dispensableMeds = visit.medications;

    // Get unique medication IDs
    const medicationIds = [...new Set(dispensableMeds.map(med => med.id))];

    if (medicationIds.length > 0) {
      // Query inventory for this hospital
      const { data: inventoryData, error: invError } = await supabase
        .from('medication_inventory')
        .select('id, medication_id')
        .eq('hospital_id', profile.hospital_id)
        .in('medication_id', medicationIds);

      if (invError) throw invError;
      if (!inventoryData || inventoryData.length === 0) throw new Error('No inventory found for medications');

      const inventoryMap = new Map(inventoryData.map(inv => [inv.medication_id, inv.id]));

      const dispensingRecords = dispensableMeds.map(med => {
        const invId = inventoryMap.get(med.id);
        if (!invId) throw new Error(`No inventory for medication ${med.name} (ID: ${med.id})`);
        return {
          medication_id: med.id,
          patient_id: visit.patient_id,
          visit_id: visit.id,
          inventory_id: invId,
          quantity_dispensed: med.quantity,
          dispensed_by: profile.user_id,
          hospital_id: profile.hospital_id,
          notes: `Dispensed for visit ${visit.id}`
        };
      });

      const { error } = await supabase
        .from('medication_dispensing')
        .insert(dispensingRecords);

      if (error) throw error;
    }
  } catch (error) {
    // Revert on error
    setCompletedVisits(prev => prev.map(v => 
      v.id === visit.id ? { ...v, dispensed: false } : v
    ));
    console.error('Error marking as dispensed:', error);
    toast({ title: 'Error', description: 'Failed to mark as dispensed', variant: 'destructive' });
  } finally {
    setIsDispensing(false);
  }
};

  const handleMarkAsDispensed = async () => {
    if (!selectedVisit) return;
    await handleMarkAsDispensedForVisit(selectedVisit);
    setSelectedVisit(null); // Close dialog
    toast({ title: 'Success', description: 'Medications dispensed successfully!' });
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Visit Details - {selectedVisit?.patient_name}
            </DialogTitle>
            <DialogDescription>
              Consultation completed on {selectedVisit?.visit_date} at {selectedVisit?.visit_time}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVisit && (
            <div className="space-y-6">
              {/* Basic Visit Information - 4 textboxes matching current format */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Patient Complaints</Label>
                  <Textarea
                    value={selectedVisit.complaints}
                    readOnly
                    rows={2}
                    className="mt-1 bg-muted resize-none"
                    placeholder="No complaints recorded"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Diagnosis</Label>
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
                <Label className="text-sm font-medium text-muted-foreground">Lab work Requisition</Label>
                <Textarea
                  value={selectedVisit.treatment_plan}
                  readOnly
                  rows={2}
                  className="mt-1 bg-muted resize-none"
                  placeholder="No lab work requisition recorded"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Prescriptions (Pharmacy)</Label>
                <Textarea
                  value={selectedVisit.prescriptions}
                  readOnly
                  rows={2}
                  className="mt-1 bg-muted resize-none"
                  placeholder="No prescriptions recorded"
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
                      <div key={`${med.id}-${index}`} className="p-3 border rounded-lg bg-blue-50">
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
                      <div key={`${test.id}-${index}`} className="p-3 border rounded-lg bg-yellow-50">
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
                    {selectedVisit.dispensed ? "Visit has been processed by pharmacy" : "Mark as processed after reviewing visit"}
                  </Label>
                </div>
                {!selectedVisit.dispensed && (
                  <Button 
                    onClick={handleMarkAsDispensed}
                    disabled={isDispensing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isDispensing ? "Processing..." : "Mark as Processed"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};