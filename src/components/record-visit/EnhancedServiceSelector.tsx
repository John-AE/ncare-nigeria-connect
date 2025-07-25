// Add this debug version to temporarily replace your EnhancedServiceSelector
// This will help us see exactly what's happening

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export const DebugEnhancedServiceSelector = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { profile } = useAuth();

  useEffect(() => {
    fetchServices();
  }, [profile]);

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
        return;
      }

      setServices(data || []);
      setFilteredServices(data || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(service => service.category).filter(category => category && category.trim() !== '') || [])];
      console.log('🏷️ Unique categories:', uniqueCategories);
      setCategories(uniqueCategories);

      // Debug individual service structure
      if (data && data.length > 0) {
        console.log('🔬 First service structure:', data[0]);
        console.log('🔬 Service keys:', Object.keys(data[0]));
      }

    } catch (error) {
      console.error('💥 Fetch error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>🐛 Debug: Available Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-semibold mb-2">Debug Info:</h4>
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>Error:</strong> {error || 'None'}</p>
              <p><strong>Services count:</strong> {services.length}</p>
              <p><strong>Filtered services count:</strong> {filteredServices.length}</p>
              <p><strong>Categories count:</strong> {categories.length}</p>
              <p><strong>Categories:</strong> {categories.join(', ')}</p>
              <p><strong>Profile exists:</strong> {profile ? 'Yes' : 'No'}</p>
            </div>

            {loading && (
              <div className="text-center py-4">Loading services...</div>
            )}

            {error && (
              <div className="text-red-600 p-4 bg-red-50 rounded">
                Error: {error}
              </div>
            )}

            {!loading && !error && services.length === 0 && (
              <div className="text-center py-4 text-yellow-600 bg-yellow-50 rounded">
                No services found in database. Check if:
                <ul className="list-disc list-inside mt-2">
                  <li>Services table has data</li>
                  <li>Services have is_active = true</li>
                  <li>You have proper permissions</li>
                </ul>
              </div>
            )}

            {!loading && services.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Raw Services Data:</h4>
                <div className="max-h-60 overflow-y-auto bg-gray-50 p-4 rounded text-xs">
                  <pre>{JSON.stringify(services, null, 2)}</pre>
                </div>
              </div>
            )}

            {!loading && filteredServices.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Services List:</h4>
                <div className="space-y-2">
                  {filteredServices.map((service, index) => (
                    <div key={service.id || index} className="p-2 border rounded">
                      <p><strong>ID:</strong> {service.id}</p>
                      <p><strong>Name:</strong> {service.name}</p>
                      <p><strong>Category:</strong> {service.category}</p>
                      <p><strong>Price:</strong> {service.price}</p>
                      <p><strong>Description:</strong> {service.description}</p>
                      <p><strong>Is Active:</strong> {service.is_active ? 'Yes' : 'No'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};