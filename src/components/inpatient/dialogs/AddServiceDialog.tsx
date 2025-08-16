/**
 * Add Service Dialog for Inpatients
 * 
 * Dialog component that allows medical staff to add services to inpatient timeline.
 * Reuses the service selection components from the billing system.
 * 
 * @author NCare Nigeria Development Team
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Search, Plus, Minus } from 'lucide-react';
import { ServiceManagementDialog } from '@/components/record-visit/ServiceManagementDialog';

interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  is_active: boolean;
}

interface ServiceItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface AddServiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  admissionId: string;
  patientId: string;
  onServiceAdded?: () => void;
}

export const AddServiceDialog = ({
  isOpen,
  onOpenChange,
  admissionId,
  patientId,
  onServiceAdded
}: AddServiceDialogProps) => {
  const { profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchServices();
    }
  }, [isOpen, profile?.hospital_id]);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, selectedCategory]);

  const fetchServices = async () => {
    if (!profile?.hospital_id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('hospital_id', profile.hospital_id)
        .eq('is_active', true)
        .order('category')
        .order('name');

      if (error) throw error;

      setServices(data || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set((data || []).map(service => service.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to fetch services');
    } finally {
      setIsLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = services;

    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    setFilteredServices(filtered);
  };

  const addService = (service: Service) => {
    const existingItem = serviceItems.find(item => item.id === service.id);
    
    if (existingItem) {
      setServiceItems(prev => 
        prev.map(item => 
          item.id === service.id 
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                total_price: (item.quantity + 1) * item.unit_price
              }
            : item
        )
      );
    } else {
      setServiceItems(prev => [...prev, {
        id: service.id,
        name: service.name,
        quantity: 1,
        unit_price: service.price,
        total_price: service.price
      }]);
    }
  };

  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeService(serviceId);
      return;
    }

    setServiceItems(prev =>
      prev.map(item =>
        item.id === serviceId
          ? { 
              ...item, 
              quantity,
              total_price: quantity * item.unit_price
            }
          : item
      )
    );
  };

  const removeService = (serviceId: string) => {
    setServiceItems(prev => prev.filter(item => item.id !== serviceId));
  };

  const calculateTotal = () => {
    return serviceItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleAddServices = async () => {
    if (!profile?.user_id || serviceItems.length === 0) return;

    setIsAdding(true);
    try {
      // Add each service to the inpatient_services table
      for (const item of serviceItems) {
        const { error } = await supabase
          .from('inpatient_services')
          .insert({
            admission_id: admissionId,
            patient_id: patientId,
            hospital_id: profile.hospital_id,
            service_id: item.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            administered_by: profile.user_id,
            administered_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error adding service:', error);
          throw error;
        }
      }

      toast.success(`${serviceItems.length} service(s) added to patient timeline`);
      setServiceItems([]);
      onServiceAdded?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding services:', error);
      toast.error('Failed to add services');
    } finally {
      setIsAdding(false);
    }
  };

  // Group services by category
  const groupedServices = categories.reduce((acc, category) => {
    acc[category] = filteredServices.filter(service => service.category === category);
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add Service to Patient Timeline</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 h-[600px]">
            {/* Available Services */}
            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Available Services</CardTitle>
                  <ServiceManagementDialog onServiceUpdated={fetchServices} />
                </div>
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search services..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-sm text-muted-foreground">Loading services...</div>
                    </div>
                  ) : Object.keys(groupedServices).length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-sm text-muted-foreground">No services found</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(groupedServices).map(([category, categoryServices]) => 
                        categoryServices.length > 0 && (
                          <div key={category}>
                            <h4 className="font-medium text-sm text-muted-foreground mb-2">
                              {category}
                            </h4>
                            <div className="space-y-2">
                              {categoryServices.map(service => (
                                <div
                                  key={service.id}
                                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium">{service.name}</div>
                                    <div className="text-sm text-primary font-semibold">
                                      ₦{service.price.toLocaleString()}
                                    </div>
                                    {service.description && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {service.description}
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => addService(service)}
                                    className="ml-2"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Selected Services */}
            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Selected Services</CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  {serviceItems.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-sm text-muted-foreground">No services selected</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {serviceItems.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              ₦{item.unit_price.toLocaleString()} each
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <div className="ml-2 font-medium">
                              ₦{item.total_price.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold text-lg">
                          ₦{calculateTotal().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddServices}
              disabled={serviceItems.length === 0 || isAdding}
            >
              {isAdding ? 'Adding...' : `Add ${serviceItems.length} Service(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  );
};