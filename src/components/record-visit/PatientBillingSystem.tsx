import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Receipt, Plus, Trash2, Edit, Save, X, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  price: number;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  category?: string;
}

interface BillItem {
  id: string;
  type: 'medication' | 'service';
  name: string;
  price: number;
  quantity?: number;
  dosage?: string;
  frequency?: string;
}

interface PatientBillingSystemProps {
  appointment: any;
  profile: any;
  onBillFinalized: () => void;
}

export const PatientBillingSystem = ({ appointment, profile, onBillFinalized }: PatientBillingSystemProps) => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [isFinalizingBill, setIsFinalizingBill] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  
  // Medication form state
  const [medicationForm, setMedicationForm] = useState({
    name: '',
    dosage: '',
    frequency: '',
    price: ''
  });

  // Service form state
  const [serviceForm, setServiceForm] = useState({
    name: '',
    price: '',
    category: ''
  });

  const { toast } = useToast();

  // Load services from database
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive"
      });
    }
  };

  const addMedication = () => {
    // Validation
    if (!medicationForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Medication name is required",
        variant: "destructive"
      });
      return;
    }

    if (!medicationForm.dosage.trim()) {
      toast({
        title: "Validation Error", 
        description: "Dosage is required",
        variant: "destructive"
      });
      return;
    }

    if (!medicationForm.frequency.trim()) {
      toast({
        title: "Validation Error",
        description: "Frequency is required", 
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(medicationForm.price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid positive price",
        variant: "destructive"
      });
      return;
    }

    const newMedication: BillItem = {
      id: `med_${Date.now()}`,
      type: 'medication',
      name: medicationForm.name,
      price: price,
      dosage: medicationForm.dosage,
      frequency: medicationForm.frequency
    };

    setBillItems(prev => [...prev, newMedication]);
    setMedicationForm({ name: '', dosage: '', frequency: '', price: '' });
    setShowMedicationForm(false);
    
    toast({
      title: "Success",
      description: "Medication added to bill"
    });
  };

  const addService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    const newService: BillItem = {
      id: `service_${Date.now()}`,
      type: 'service', 
      name: service.name,
      price: service.price,
      quantity: 1
    };

    setBillItems(prev => [...prev, newService]);
    
    toast({
      title: "Success",
      description: "Service added to bill"
    });
  };

  const removeItem = (id: string) => {
    setBillItems(prev => prev.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return billItems.reduce((total, item) => total + item.price * (item.quantity || 1), 0);
  };

  const saveOrUpdateService = async () => {
    // Validation
    if (!serviceForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Service name is required",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(serviceForm.price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Validation Error", 
        description: "Please enter a valid positive price",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingService) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update({
            name: serviceForm.name,
            price: price,
            category: serviceForm.category || null
          })
          .eq('id', editingService.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Service updated successfully"
        });
      } else {
        // Create new service
        const { error } = await supabase
          .from('services')
          .insert({
            name: serviceForm.name,
            price: price,
            category: serviceForm.category || null
          });

        if (error) throw error;
        
        toast({
          title: "Success", 
          description: "Service created successfully"
        });
      }

      await fetchServices();
      setServiceForm({ name: '', price: '', category: '' });
      setEditingService(null);
      setShowServiceDialog(false);
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Error",
        description: "Failed to save service",
        variant: "destructive"
      });
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', serviceId);

      if (error) throw error;
      
      await fetchServices();
      toast({
        title: "Success",
        description: "Service deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive"
      });
    }
  };

  const finalizeBill = async () => {
    if (billItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the bill",
        variant: "destructive"
      });
      return;
    }

    setIsFinalizingBill(true);

    try {
      // Create bill record
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .insert({
          patient_id: appointment.patient_id,
          amount: calculateTotal(),
          description: `Consultation visit on ${appointment.scheduled_date}`,
          created_by: profile.user_id
        })
        .select()
        .single();

      if (billError) throw billError;

      // Create bill items
      const billItemsToInsert = billItems.map(item => ({
        bill_id: billData.id,
        service_id: item.type === 'service' ? 
          services.find(s => s.name === item.name)?.id : 
          null,
        quantity: item.quantity || 1,
        unit_price: item.price,
        total_price: item.price * (item.quantity || 1)
      }));

      // For medications, we need to create temporary service records or handle differently
      const serviceItemsToInsert = [];
      for (const item of billItems) {
        if (item.type === 'medication') {
          // Create a temporary service for this medication
          const { data: serviceData, error: serviceError } = await supabase
            .from('services')
            .insert({
              name: `${item.name} (${item.dosage}, ${item.frequency})`,
              price: item.price,
              category: 'Medication',
              is_active: false // Mark as inactive since it's a custom medication
            })
            .select()
            .single();

          if (serviceError) throw serviceError;

          serviceItemsToInsert.push({
            bill_id: billData.id,
            service_id: serviceData.id,
            quantity: 1,
            unit_price: item.price,
            total_price: item.price
          });
        } else {
          const service = services.find(s => s.name === item.name);
          if (service) {
            serviceItemsToInsert.push({
              bill_id: billData.id,
              service_id: service.id,
              quantity: item.quantity || 1,
              unit_price: item.price,
              total_price: item.price * (item.quantity || 1)
            });
          }
        }
      }

      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(serviceItemsToInsert);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: `Bill finalized successfully! Bill ID: ${billData.id}`,
      });

      onBillFinalized();
    } catch (error) {
      console.error('Error finalizing bill:', error);
      toast({
        title: "Error",
        description: "Failed to finalize bill",
        variant: "destructive"
      });
    } finally {
      setIsFinalizingBill(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Patient Billing System
          </CardTitle>
          <CardDescription>
            Real-time bill generation for {appointment?.patients?.first_name} {appointment?.patients?.last_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Medication Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">Medications</h4>
              <Dialog open={showMedicationForm} onOpenChange={setShowMedicationForm}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medication
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Medication</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="med-name">Medication Name *</Label>
                      <Input
                        id="med-name"
                        value={medicationForm.name}
                        onChange={(e) => setMedicationForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter medication name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dosage">Dosage *</Label>
                      <Input
                        id="dosage"
                        value={medicationForm.dosage}
                        onChange={(e) => setMedicationForm(prev => ({ ...prev, dosage: e.target.value }))}
                        placeholder="e.g., 500mg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="frequency">Frequency *</Label>
                      <Input
                        id="frequency"
                        value={medicationForm.frequency}
                        onChange={(e) => setMedicationForm(prev => ({ ...prev, frequency: e.target.value }))}
                        placeholder="e.g., twice daily"
                      />
                    </div>
                    <div>
                      <Label htmlFor="med-price">Price (₦) *</Label>
                      <Input
                        id="med-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={medicationForm.price}
                        onChange={(e) => setMedicationForm(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="Enter price in naira"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addMedication} className="flex-1">
                        Add Medication
                      </Button>
                      <Button variant="outline" onClick={() => setShowMedicationForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Services Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">Services</h4>
              <div className="flex gap-2">
                <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Manage Services
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingService ? 'Edit Service' : 'Manage Services'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Service Form */}
                      <div className="border rounded-lg p-4 space-y-4">
                        <h5 className="font-medium">
                          {editingService ? 'Edit Service' : 'Add New Service'}
                        </h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Service Name *</Label>
                            <Input
                              value={serviceForm.name}
                              onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter service name"
                            />
                          </div>
                          <div>
                            <Label>Price (₦) *</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={serviceForm.price}
                              onChange={(e) => setServiceForm(prev => ({ ...prev, price: e.target.value }))}
                              placeholder="Enter price"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Category</Label>
                          <Input
                            value={serviceForm.category}
                            onChange={(e) => setServiceForm(prev => ({ ...prev, category: e.target.value }))}
                            placeholder="Enter category (optional)"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={saveOrUpdateService}>
                            <Save className="h-4 w-4 mr-2" />
                            {editingService ? 'Update' : 'Save'} Service
                          </Button>
                          {editingService && (
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setEditingService(null);
                                setServiceForm({ name: '', price: '', category: '' });
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Services List */}
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        <h5 className="font-medium">Existing Services</h5>
                        {services.map((service) => (
                          <div key={service.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <span className="font-medium">{service.name}</span>
                              <span className="text-muted-foreground ml-2">₦{service.price.toLocaleString()}</span>
                              {service.category && (
                                <span className="text-xs bg-muted px-2 py-1 rounded ml-2">
                                  {service.category}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingService(service);
                                  setServiceForm({
                                    name: service.name,
                                    price: service.price.toString(),
                                    category: service.category || ''
                                  });
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteService(service.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Select onValueChange={addService}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select service to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - ₦{service.price.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Bill Summary */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-semibold">Bill Summary</h4>
            {billItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No items added to bill yet
              </p>
            ) : (
              <div className="space-y-2">
                {billItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.type === 'medication' && (
                        <div className="text-sm text-muted-foreground">
                          {item.dosage} • {item.frequency}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">₦{item.price.toLocaleString()}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-2 flex justify-between items-center text-lg font-bold">
                  <span>Grand Total:</span>
                  <span>₦{calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowPreviewDialog(true)} 
                disabled={billItems.length === 0}
                variant="outline"
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Bill
              </Button>
              <Button 
                onClick={finalizeBill} 
                disabled={billItems.length === 0 || isFinalizingBill}
                className="flex-1"
              >
                {isFinalizingBill ? "Finalizing..." : "Finalize Bill"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bill Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bill Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center border-b pb-4">
              <h3 className="text-lg font-semibold">Medical Bill</h3>
              <p className="text-muted-foreground">
                Patient: {appointment?.patients?.first_name} {appointment?.patients?.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                Date: {new Date().toLocaleDateString()}
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Bill Items</h4>
              {billItems.map((item, index) => (
                <div key={item.id} className="flex justify-between items-start p-3 border rounded">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{index + 1}. {item.name}</span>
                      <span className="font-medium">₦{item.price.toLocaleString()}</span>
                    </div>
                    {item.type === 'medication' && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Dosage: {item.dosage} | Frequency: {item.frequency}
                      </div>
                    )}
                    {item.type === 'service' && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Quantity: {item.quantity || 1}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total Amount:</span>
                <span>₦{calculateTotal().toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowPreviewDialog(false)} className="flex-1">
                Close Preview
              </Button>
              <Button 
                onClick={() => {
                  setShowPreviewDialog(false);
                  finalizeBill();
                }}
                disabled={isFinalizingBill}
                className="flex-1"
              >
                {isFinalizingBill ? "Finalizing..." : "Confirm & Finalize Bill"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};