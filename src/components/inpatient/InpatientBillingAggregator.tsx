/**
 * Inpatient Billing Aggregator - FIXED VERSION
 * 
 * Displays minimum total bill for inpatient services and medications.
 * Provides preview and finalize bill functionality.
 * 
 * @author NCare Nigeria Development Team
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Receipt, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface BillItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  type: 'medication' | 'service';
  administered_at: string;
  // Add these fields to properly map to bill_items table
  medication_id?: string;
  service_id?: string;
}

interface InpatientBillingAggregatorProps {
  admissionId: string;
  patientId: string;
  refreshTrigger?: (callback: () => void) => void;
  onBillCreated?: () => void;
}

export const InpatientBillingAggregator = ({
  admissionId,
  patientId,
  refreshTrigger,
  onBillCreated
}: InpatientBillingAggregatorProps) => {
  const { profile } = useAuth();
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBill, setIsCreatingBill] = useState(false);

  useEffect(() => {
    fetchBillItems();
  }, [admissionId]);

  useEffect(() => {
    if (refreshTrigger) {
      refreshTrigger(fetchBillItems);
    }
  }, [refreshTrigger]);

  const fetchBillItems = async () => {
    if (!profile?.hospital_id) return;

    setIsLoading(true);
    try {
      // Fetch medications - Get available columns from inpatient_medications
      const { data: medications, error: medError } = await supabase
        .from('inpatient_medications')
        .select('*')
        .eq('admission_id', admissionId)
        .eq('hospital_id', profile.hospital_id);

      if (medError) throw medError;

      // Fetch services with service details - FIXED: Get service_id properly
      const { data: services, error: servicesError } = await supabase
        .from('inpatient_services')
        .select(`
          id,
          quantity,
          unit_price,
          total_price,
          administered_at,
          service_id,
          services (
            name
          )
        `)
        .eq('admission_id', admissionId)
        .eq('hospital_id', profile.hospital_id);

      if (servicesError) throw servicesError;

      // Process medications - Handle missing medication_id field
      const medicationItems: BillItem[] = (medications || []).map(med => ({
        id: med.id,
        name: `${med.medication_name} (${med.dosage})`,
        quantity: 1,
        unit_price: 500, // Default medication cost
        total_price: 500,
        type: 'medication' as const,
        administered_at: med.administered_at,
        medication_id: null // Will be handled differently in bill creation
      }));

      // Process services - FIXED: Include service_id for bill_items
      const serviceItems: BillItem[] = (services || []).map(service => ({
        id: service.id,
        name: service.services?.name || 'Unknown Service',
        quantity: service.quantity,
        unit_price: service.unit_price,
        total_price: service.total_price,
        type: 'service' as const,
        administered_at: service.administered_at,
        service_id: service.service_id // This is what goes to bill_items.service_id
      }));

      const allItems = [...medicationItems, ...serviceItems];
      setBillItems(allItems);
      
      const total = allItems.reduce((sum, item) => sum + item.total_price, 0);
      setTotalAmount(total);
    } catch (error) {
      console.error('Error fetching bill items:', error);
      toast.error('Failed to fetch billing information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizeBill = async () => {
    if (!profile?.user_id || billItems.length === 0) return;

    setIsCreatingBill(true);
    try {
      // Check if bill already exists (use patient_id + bill_type check)
      const { data: existingBill, error: checkError } = await supabase
        .from('bills')
        .select('id')
        .eq('patient_id', patientId)
        .eq('bill_type', 'inpatient')
        .eq('description', 'Inpatient Services and Medications')
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw checkError;
      }

      if (existingBill) {
        toast.error('Bill already exists for this admission');
        return;
      }

      // Create the main bill with shorter description (no UUID)
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .insert({
          patient_id: patientId,
          amount: totalAmount,
          description: 'Inpatient Services and Medications',
          created_by: profile.user_id,
          hospital_id: profile.hospital_id,
          bill_type: 'inpatient'
        })
        .select()
        .single();

      if (billError) throw billError;

      // Create bill items - Now with proper medication_id
      const billItemsData = billItems.map(item => ({
        bill_id: bill.id,
        service_id: item.type === 'service' ? item.service_id : null,
        medication_id: item.type === 'medication' ? item.medication_id : null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(billItemsData);

      if (itemsError) throw itemsError;

      toast.success('Inpatient bill created successfully');
      setShowPreviewDialog(false);
      onBillCreated?.();
    } catch (error) {
      console.error('Error creating bill:', error);
      if (error.code === '23505') { // Unique constraint violation
        toast.error('Bill already exists for this admission');
      } else {
        toast.error('Failed to create bill: ' + error.message);
      }
    } finally {
      setIsCreatingBill(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Receipt className="h-4 w-4" />
            Billing Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground text-xs">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Receipt className="h-4 w-4" />
            Billing Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Items:</span>
            <Badge variant="secondary" className="text-xs">{billItems.length}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Minimum Total Bill:</span>
            <span className="text-lg font-bold text-primary">
              ₦{totalAmount.toLocaleString()}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreviewDialog(true)}
              disabled={billItems.length === 0}
              className="flex-1 text-xs"
              size="sm"
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview Bill
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bill Preview Dialog - FIXED: Added DialogDescription */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Inpatient Bill Details</DialogTitle>
            <DialogDescription className="text-sm">
              Review the bill items before finalizing the inpatient bill.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3">
              <h3 className="font-medium text-sm">Bill Items</h3>
              <div className="space-y-2">
                {billItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{item.name}</span>
                        <Badge variant={item.type === 'medication' ? 'default' : 'secondary'} className="text-xs">
                          {item.type}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Quantity: {item.quantity} × ₦{item.unit_price.toLocaleString()}
                      </div>
                    </div>
                    <div className="font-medium text-sm">
                      ₦{item.total_price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between text-base font-medium">
              <span>Total Amount:</span>
              <span>₦{totalAmount.toLocaleString()}</span>
            </div>

            <div className="flex justify-end space-x-2 pt-3">
              <Button
                variant="outline"
                onClick={() => setShowPreviewDialog(false)}
                disabled={isCreatingBill}
                size="sm"
                className="text-xs"
              >
                Close
              </Button>
              <Button
                onClick={handleFinalizeBill}
                disabled={isCreatingBill}
                size="sm"
                className="text-xs"
              >
                {isCreatingBill ? 'Creating Bill...' : 'Finalize Bill'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};