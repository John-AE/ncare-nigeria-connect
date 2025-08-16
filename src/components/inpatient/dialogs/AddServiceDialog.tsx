/**
 * Add Service Dialog for Inpatients
 * 
 * Dialog component that allows medical staff to add services to inpatient timeline.
 * Reuses the service selection components from the billing system.
 * 
 * @author NCare Nigeria Development Team
 */

import { useState } from 'react';
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
import { EnhancedServiceSelector } from '@/components/record-visit/EnhancedServiceSelector';

interface ServiceItem {
  id: string;
  service_name: string;
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
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddService = async () => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Service to Patient Timeline</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 border border-border rounded-lg">
            <p className="text-sm text-muted-foreground mb-4">
              Service selection functionality will be implemented here.
              For now, please use the main billing system to add services.
            </p>
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
              onClick={handleAddService}
              disabled={serviceItems.length === 0 || isAdding}
            >
              {isAdding ? 'Adding...' : `Add ${serviceItems.length} Service(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};