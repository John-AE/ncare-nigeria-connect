import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Service } from "@/types/recordVisit";

interface ServiceItem {
  id: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface EnhancedServiceSelectorProps {
  serviceItems: ServiceItem[];
  setServiceItems: (items: ServiceItem[]) => void;
  discount: number;
  setDiscount: (discount: number) => void;
  discountReason: string;
  setDiscountReason: (reason: string) => void;
}

export const EnhancedServiceSelector = ({
  serviceItems,
  setServiceItems,
  discount,
  setDiscount,
  discountReason,
  setDiscountReason
}: EnhancedServiceSelectorProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    fetchServices();
  }, [profile]);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, selectedCategory]);

  const fetchServices = async () => {
    try {
      console.log('🔍 Starting to fetch services...');
      console.log('👤 Current profile:', profile);
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      console.log('📊 Raw services data:', data);
      console.log('❌ Services error:', error);
      console.log('📈 Services count:', data?.length || 0);

      if (error) {
        console.error('💥 Supabase error:', error);
        setError(error.message);
        throw error;
      }

      // Debug individual service structure
      if (data && data.length > 0) {
        console.log('🔬 First service structure:', data[0]);
        console.log('🔬 Service keys:', Object.keys(data[0]));
      }

      setServices(data || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(service => service.category).filter(category => category && category.trim() !== '') || [])];
      console.log('🏷️ Unique categories:', uniqueCategories);
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('💥 Error fetching services:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    console.log('🔍 Filtering services...');
    console.log('📊 Total services:', services.length);
    console.log('🏷️ Selected category:', selectedCategory);
    console.log('🔎 Search term:', searchTerm);
    
    let filtered = services;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
      console.log('🏷️ After category filter:', filtered.length);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('🔎 After search filter:', filtered.length);
    }

    console.log('✅ Final filtered services:', filtered.length);
    setFilteredServices(filtered);
  };

  const addService = (service: Service) => {
    const existingItem = serviceItems.find(item => item.id === service.id);
    
    if (existingItem) {
      // Increase quantity if service already exists
      setServiceItems(
        serviceItems.map(item =>
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
      // Add new service
      const newItem: ServiceItem = {
        id: service.id,
        service_name: service.name,
        quantity: 1,
        unit_price: service.price,
        total_price: service.price
      };
      setServiceItems([...serviceItems, newItem]);
    }
  };

  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeService(serviceId);
      return;
    }

    setServiceItems(
      serviceItems.map(item =>
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
    setServiceItems(serviceItems.filter(item => item.id !== serviceId));
  };

  const subtotal = serviceItems.reduce((sum, item) => sum + item.total_price, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  const groupedServices = categories.reduce((acc, category) => {
    const categoryServices = filteredServices.filter(service => service.category === category);
    if (categoryServices.length > 0) {
      acc[category] = categoryServices;
    }
    return acc;
  }, {} as Record<string, Service[]>);

  console.log('🏗️ Grouped services:', groupedServices);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Service Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Available Services</CardTitle>
          {/* DEBUG INFO - Remove this after debugging */}
          <div className="text-xs bg-yellow-50 p-2 rounded border">
            <strong>🐛 Debug:</strong> Loading: {loading ? 'Yes' : 'No'} | 
            Services: {services.length} | 
            Filtered: {filteredServices.length} | 
            Categories: {categories.length} |
            Error: {error || 'None'}
          </div>
          
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
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
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading services...</div>
          ) : error ? (
            <div className="text-red-600 p-4 bg-red-50 rounded">
              Error: {error}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-4 text-yellow-600 bg-yellow-50 rounded">
              No services found in database
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-4 text-blue-600 bg-blue-50 rounded">
              No services match your current filters
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {Object.entries(groupedServices).map(([category, categoryServices]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                      {category} ({categoryServices.length})
                    </h3>
                    <div className="space-y-2">
                      {categoryServices.map(service => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{service.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ₦{service.price.toLocaleString()}
                            </p>
                            {service.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {service.description}
                              </p>
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
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Selected Services & Bill Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Selected Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {serviceItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No services selected
            </div>
          ) : (
            <div className="space-y-3">
              {serviceItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.service_name}</p>
                    <p className="text-xs text-muted-foreground">
                      ₦{item.unit_price.toLocaleString()} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-16 h-8"
                    />
                    <p className="text-sm font-medium w-20 text-right">
                      ₦{item.total_price.toLocaleString()}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeService(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {serviceItems.length > 0 && (
            <>
              <Separator />
              
              {/* Discount Section */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Discount %"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="w-24"
                    min="0"
                    max="100"
                  />
                  <Input
                    placeholder="Reason for discount"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <Separator />

              {/* Bill Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Discount ({discount}%):</span>
                    <span>-₦{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>₦{total.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};