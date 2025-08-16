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

      toast.success(`${serviceItems.length} service(s) added to timeline`);
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
      <DialogContent className="max-w-5xl max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-2 border-b shrink-0">
          <DialogTitle className="text-sm">Add Service to Timeline</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 flex-1 min-h-0 p-3">
          {/* Available Services */}
          <Card className="flex flex-col h-full min-h-0">
            <CardHeader className="pb-1 px-2 py-2 shrink-0">
              <div className="flex items-center justify-between mb-1">
                <CardTitle className="text-xs font-medium">Available Services</CardTitle>
                <ServiceManagementDialog onServiceUpdated={fetchServices} />
              </div>
              
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 h-2.5 w-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-6 h-6 text-[10px]"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[120px] h-6 text-[10px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] max-h-48">
                    <SelectItem value="all" className="text-[10px]">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category} className="text-[10px]">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-2 overflow-hidden">
              <ScrollArea className="h-full pr-2">
                {isLoading ? (
                  <div className="flex items-center justify-center h-20">
                    <div className="text-[10px] text-muted-foreground">Loading services...</div>
                  </div>
                ) : Object.keys(groupedServices).length === 0 ? (
                  <div className="flex items-center justify-center h-20">
                    <div className="text-[10px] text-muted-foreground">No services found</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(groupedServices).map(([category, categoryServices]) => 
                      categoryServices.length > 0 && (
                        <div key={category} className="space-y-2">
                          <h4 className="font-medium text-[10px] text-muted-foreground mb-2 uppercase tracking-wide sticky top-0 bg-background py-1">
                            {category}
                          </h4>
                          <div className="space-y-1.5">
                            {categoryServices.map(service => (
                              <div
                                key={service.id}
                                className="flex items-center justify-between p-2 border rounded-sm hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex-1 min-w-0 pr-2">
                                  <div className="font-medium text-[10px] truncate">{service.name}</div>
                                  <div className="text-[9px] text-primary font-semibold">
                                    ₦{service.price.toLocaleString()}
                                  </div>
                                  {service.description && (
                                    <div className="text-[8px] text-muted-foreground mt-0.5 line-clamp-2">
                                      {service.description}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => addService(service)}
                                  className="h-6 w-6 p-0 shrink-0"
                                >
                                  <Plus className="h-3 w-3" />
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
          <Card className="flex flex-col h-full min-h-0">
            <CardHeader className="pb-1 px-2 py-2 shrink-0">
              <CardTitle className="text-xs font-medium">Selected Services</CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 p-2 overflow-hidden">
              <ScrollArea className="h-full pr-2">
                {serviceItems.length === 0 ? (
                  <div className="flex items-center justify-center h-20">
                    <div className="text-[10px] text-muted-foreground">No services selected</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {serviceItems.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 border rounded-sm"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-medium text-[10px] truncate">{item.name}</div>
                          <div className="text-[9px] text-muted-foreground">
                            ₦{item.unit_price.toLocaleString()} each
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-5 w-5 p-0"
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </Button>
                          <span className="w-6 text-center text-[10px]">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-5 w-5 p-0"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </Button>
                          <div className="ml-2 font-medium text-[10px] min-w-0">
                            ₦{item.total_price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Separator className="my-2" />
                    
                    <div className="flex justify-between items-center p-2 bg-muted rounded-sm sticky bottom-0">
                      <span className="font-medium text-[10px]">Total:</span>
                      <span className="font-bold text-xs">
                        ₦{calculateTotal().toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-2 p-3 border-t bg-background shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
            className="h-7 text-[10px] px-3"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddServices}
            disabled={serviceItems.length === 0 || isAdding}
            className="h-7 text-[10px] px-3"
          >
            {isAdding ? 'Adding...' : `Add ${serviceItems.length} Service(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};