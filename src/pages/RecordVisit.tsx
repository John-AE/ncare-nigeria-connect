import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  patient_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  patients: {
    first_name: string;
    last_name: string;
  };
}

interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface Prescription {
  serviceId: string;
  quantity: number;
  instructions: string;
}

export const RecordVisit = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [visitData, setVisitData] = useState({
    complaints: "",
    diagnosis: "",
    treatment_plan: ""
  });
  
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch appointment details
        const { data: appointmentData } = await supabase
          .from('appointments')
          .select(`
            *,
            patients(first_name, last_name)
          `)
          .eq('id', appointmentId)
          .single();

        setAppointment(appointmentData);

        // Fetch available services
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name');

        setServices(servicesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load appointment details"
        });
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchData();
    }
  }, [appointmentId, toast]);

  const addPrescription = () => {
    setPrescriptions([...prescriptions, { serviceId: "", quantity: 1, instructions: "" }]);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const updatePrescription = (index: number, field: keyof Prescription, value: string | number) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptions(updated);
  };

  const handleSaveVisit = async () => {
    if (!appointment || !profile) return;

    setSaving(true);
    try {
      // Create visit record
      const { data: visitRecord, error: visitError } = await supabase
        .from('visits')
        .insert({
          appointment_id: appointment.id,
          patient_id: appointment.patient_id,
          doctor_id: profile.user_id,
          visit_date: appointment.scheduled_date,
          visit_time: appointment.start_time,
          complaints: visitData.complaints,
          diagnosis: visitData.diagnosis,
          treatment_plan: visitData.treatment_plan
        })
        .select()
        .single();

      if (visitError) throw visitError;

      // Create prescriptions
      if (prescriptions.length > 0) {
        const prescriptionInserts = prescriptions
          .filter(p => p.serviceId)
          .map(p => ({
            visit_id: visitRecord.id,
            service_id: p.serviceId,
            quantity: p.quantity,
            instructions: p.instructions
          }));

        if (prescriptionInserts.length > 0) {
          const { error: prescriptionError } = await supabase
            .from('prescriptions')
            .insert(prescriptionInserts);

          if (prescriptionError) throw prescriptionError;

          // Create bill and bill items
          const totalAmount = prescriptions.reduce((sum, p) => {
            const service = services.find(s => s.id === p.serviceId);
            return sum + (service ? service.price * p.quantity : 0);
          }, 0);

          const { data: billData, error: billError } = await supabase
            .from('bills')
            .insert({
              patient_id: appointment.patient_id,
              amount: totalAmount,
              description: `Visit on ${appointment.scheduled_date}`,
              created_by: profile.user_id
            })
            .select()
            .single();

          if (billError) throw billError;

          // Create bill items
          const billItems = prescriptions
            .filter(p => p.serviceId)
            .map(p => {
              const service = services.find(s => s.id === p.serviceId);
              return {
                bill_id: billData.id,
                service_id: p.serviceId,
                quantity: p.quantity,
                unit_price: service?.price || 0,
                total_price: (service?.price || 0) * p.quantity
              };
            });

          const { error: billItemsError } = await supabase
            .from('bill_items')
            .insert(billItems);

          if (billItemsError) throw billItemsError;
        }
      }

      // Update appointment status to completed
      await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointment.id);

      toast({
        title: "Success",
        description: "Visit recorded successfully and bill generated"
      });

      navigate('/doctor-dashboard');
    } catch (error) {
      console.error('Error saving visit:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save visit record"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Appointment not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/doctor-dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Record Visit</h1>
          <p className="text-muted-foreground">
            {appointment.scheduled_date} at {appointment.start_time} - {appointment.end_time}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>Patient details for this visit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="patient-name">Patient Name</Label>
              <Input
                id="patient-name"
                value={`${appointment.patients.first_name} ${appointment.patients.last_name}`}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input value={appointment.scheduled_date} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Time</Label>
                <Input value={`${appointment.start_time} - ${appointment.end_time}`} disabled className="bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visit Details</CardTitle>
            <CardDescription>Record the details of this patient visit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="complaints">Patient Complaints</Label>
              <Textarea
                id="complaints"
                placeholder="Enter patient complaints..."
                value={visitData.complaints}
                onChange={(e) => setVisitData({...visitData, complaints: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea
                id="diagnosis"
                placeholder="Enter diagnosis..."
                value={visitData.diagnosis}
                onChange={(e) => setVisitData({...visitData, diagnosis: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="treatment-plan">Treatment Plan</Label>
              <Textarea
                id="treatment-plan"
                placeholder="Enter treatment plan..."
                value={visitData.treatment_plan}
                onChange={(e) => setVisitData({...visitData, treatment_plan: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Prescriptions & Services</CardTitle>
              <CardDescription>Add medications and services for this visit</CardDescription>
            </div>
            <Button onClick={addPrescription} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Prescription
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {prescriptions.map((prescription, index) => (
            <div key={index} className="flex gap-4 items-end p-4 border rounded-lg">
              <div className="flex-1">
                <Label>Service/Medication</Label>
                <Select
                  value={prescription.serviceId}
                  onValueChange={(value) => updatePrescription(index, 'serviceId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - ₦{service.price}
                        {service.category && (
                          <Badge variant="secondary" className="ml-2">{service.category}</Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={prescription.quantity}
                  onChange={(e) => updatePrescription(index, 'quantity', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="flex-1">
                <Label>Instructions</Label>
                <Input
                  placeholder="Usage instructions..."
                  value={prescription.instructions}
                  onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removePrescription(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {prescriptions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No prescriptions added yet. Click "Add Prescription" to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate('/doctor-dashboard')}>
          Cancel
        </Button>
        <Button onClick={handleSaveVisit} disabled={saving}>
          {saving ? "Saving..." : "Save Visit & Generate Bill"}
        </Button>
      </div>
    </div>
  );
};