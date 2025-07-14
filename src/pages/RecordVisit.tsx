import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Receipt, Edit } from "lucide-react";
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
  description?: string;
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
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [newService, setNewService] = useState({ name: "", description: "", price: 0, category: "" });
  const [editingService, setEditingService] = useState<Service | null>(null);

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

  const fetchServices = async () => {
    const { data: servicesData } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name');
    setServices(servicesData || []);
  };

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

  const calculateTotal = () => {
    return prescriptions.reduce((sum, p) => {
      const service = services.find(s => s.id === p.serviceId);
      return sum + (service ? service.price * p.quantity : 0);
    }, 0);
  };

  const saveService = async () => {
    if (!newService.name || !newService.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(newService)
          .eq('id', editingService.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('services')
          .insert(newService);
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Service ${editingService ? 'updated' : 'added'} successfully`,
      });

      setNewService({ name: "", description: "", price: 0, category: "" });
      setEditingService(null);
      setShowServiceDialog(false);
      fetchServices();

    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Error",
        description: "Failed to save service",
        variant: "destructive"
      });
    }
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
              <CardTitle>Services</CardTitle>
              <CardDescription>Add medications and services for this visit</CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Manage Services
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Manage Services</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="serviceName">Service Name</Label>
                        <Input
                          id="serviceName"
                          value={newService.name}
                          onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter service name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="servicePrice">Price (₦)</Label>
                        <Input
                          id="servicePrice"
                          type="number"
                          value={newService.price}
                          onChange={(e) => setNewService(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          placeholder="Enter price"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="serviceDescription">Description</Label>
                      <Input
                        id="serviceDescription"
                        value={newService.description}
                        onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="serviceCategory">Category</Label>
                      <Input
                        id="serviceCategory"
                        value={newService.category}
                        onChange={(e) => setNewService(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="Enter category"
                      />
                    </div>
                    <Button onClick={saveService} className="w-full">
                      {editingService ? "Update Service" : "Add Service"}
                    </Button>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">Existing Services</h4>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {services.map(service => (
                          <div key={service.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <p className="font-medium">{service.name}</p>
                              <p className="text-sm text-muted-foreground">₦{service.price.toLocaleString()}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditingService(service);
                                setNewService({
                                  name: service.name,
                                  description: service.description || "",
                                  price: service.price,
                                  category: service.category || ""
                                });
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={addPrescription} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>
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
              No services added yet. Click "Add Service" to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Billing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Patient Billing
          </CardTitle>
          <CardDescription>Review and generate bill for this visit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Dialog open={showBillPreview} onOpenChange={setShowBillPreview}>
              <DialogTrigger asChild>
                <Button disabled={prescriptions.length === 0}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Preview Bill
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bill Preview</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h3 className="font-semibold">Patient: {appointment?.patients.first_name} {appointment?.patients.last_name}</h3>
                    <p className="text-sm text-muted-foreground">Visit Date: {appointment?.scheduled_date}</p>
                    <p className="text-sm text-muted-foreground">Doctor: Dr. {profile?.username}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Services & Medications</h4>
                    <div className="space-y-2">
                      {prescriptions.filter(p => p.serviceId).map((prescription, index) => {
                        const service = services.find(s => s.id === prescription.serviceId);
                        if (!service) return null;
                        return (
                          <div key={index} className="flex justify-between items-center p-2 border rounded">
                            <div>
                              <p className="font-medium">{service.name}</p>
                              <p className="text-sm text-muted-foreground">Qty: {prescription.quantity}</p>
                              {prescription.instructions && (
                                <p className="text-xs text-muted-foreground">{prescription.instructions}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium">₦{(service.price * prescription.quantity).toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">₦{service.price.toLocaleString()} each</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Grand Total:</span>
                      <span>₦{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveVisit} disabled={saving} className="flex-1">
                      {saving ? "Generating..." : "Generate Final Bill"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowBillPreview(false)}>
                      Edit
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {prescriptions.length > 0 && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Current Bill Summary</h4>
              <div className="space-y-1">
                {prescriptions.filter(p => p.serviceId).map((prescription, index) => {
                  const service = services.find(s => s.id === prescription.serviceId);
                  if (!service) return null;
                  return (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{service.name} x{prescription.quantity}</span>
                      <span>₦{(service.price * prescription.quantity).toLocaleString()}</span>
                    </div>
                  );
                })}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>₦{calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate('/doctor-dashboard')}>
          Cancel
        </Button>
        <Button onClick={() => setShowBillPreview(true)} disabled={prescriptions.length === 0}>
          Save Visit & Preview Bill
        </Button>
      </div>
    </div>
  );
};
