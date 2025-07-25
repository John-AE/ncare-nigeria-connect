import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EnhancedServiceSelector } from "./EnhancedServiceSelector";
import { MedicationSelector } from "./MedicationSelector";
import { SimpleBillPreviewDialog } from "./SimpleBillPreviewDialog";

interface ServiceItem {
  id: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface MedicationItem {
  id: string;
  medication_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PatientBillingSystemProps {
  appointment: any;
  profile: any;
  onBillFinalized: () => void;
}

export const PatientBillingSystem = ({ appointment, profile, onBillFinalized }: PatientBillingSystemProps) => {
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [medicationItems, setMedicationItems] = useState<MedicationItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [isFinalizingBill, setIsFinalizingBill] = useState(false);

  const { toast } = useToast();

  const calculateSubtotal = () => {
    const servicesTotal = serviceItems.reduce((total, item) => total + item.total_price, 0);
    const medicationsTotal = medicationItems.reduce((total, item) => total + item.total_price, 0);
    return servicesTotal + medicationsTotal;
  };

  const calculateDiscountAmount = () => {
    return (calculateSubtotal() * discount) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscountAmount();
  };

  const validateBillData = () => {
    // Check if required appointment data exists
    if (!appointment?.patient_id) {
      throw new Error("Patient ID is missing from appointment data");
    }

    if (!profile?.user_id) {
      throw new Error("User ID is missing from profile data");
    }

    if (!profile?.hospital_id) {
      throw new Error("Hospital ID is missing from profile data");
    }

    // Validate service items
    for (const item of serviceItems) {
      if (!item.id || !item.service_name || item.quantity <= 0 || item.unit_price <= 0) {
        throw new Error(`Invalid service item: ${item.service_name || 'Unknown service'}`);
      }
    }

    // Validate medication items
    for (const item of medicationItems) {
      if (!item.id || !item.medication_name || item.quantity <= 0 || item.unit_price <= 0) {
        throw new Error(`Invalid medication item: ${item.medication_name || 'Unknown medication'}`);
      }
    }
  };

  const finalizeBill = async () => {
    if (serviceItems.length === 0 && medicationItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one service or medication to the bill",
        variant: "destructive"
      });
      return;
    }

    setIsFinalizingBill(true);

    try {
      // Validate data before proceeding
      validateBillData();

      const totalAmount = calculateTotal();
      const discountAmount = calculateDiscountAmount();
      
      console.log('Creating bill with data:', {
        patient_id: appointment.patient_id,
        amount: totalAmount,
        discount_amount: discountAmount,
        discount_reason: discountReason || null,
        description: `Consultation visit on ${appointment.scheduled_date}`,
        created_by: profile.user_id,
        hospital_id: profile.hospital_id
      });

      // Create bill record
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .insert({
          patient_id: appointment.patient_id,
          amount: totalAmount,
          discount_amount: discountAmount,
          discount_reason: discountReason || null,
          description: `Consultation visit on ${appointment.scheduled_date}`,
          created_by: profile.user_id,
          hospital_id: profile.hospital_id
        })
        .select()
        .single();

      if (billError) {
        console.error('Bill creation error:', billError);
        throw new Error(`Failed to create bill: ${billError.message}`);
      }

      if (!billData?.id) {
        throw new Error('Bill was created but no ID was returned');
      }

      console.log('Bill created successfully:', billData);

      // Create bill items for services
      if (serviceItems.length > 0) {
        const serviceBillItems = serviceItems.map(item => ({
          bill_id: billData.id,
          service_id: item.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          item_type: 'service' // Add item type for clarity
        }));

        console.log('Creating service bill items:', serviceBillItems);

        const { error: serviceItemsError } = await supabase
          .from('bill_items')
          .insert(serviceBillItems);

        if (serviceItemsError) {
          console.error('Service items creation error:', serviceItemsError);
          throw new Error(`Failed to create service items: ${serviceItemsError.message}`);
        }
      }

      // Create bill items for medications
      if (medicationItems.length > 0) {
        const medicationBillItems = medicationItems.map(item => ({
          bill_id: billData.id,
          medication_id: item.id, // Use medication_id instead of service_id for medications
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          item_type: 'medication' // Add item type for clarity
        }));

        console.log('Creating medication bill items:', medicationBillItems);

        const { error: medicationItemsError } = await supabase
          .from('bill_items')
          .insert(medicationBillItems);

        if (medicationItemsError) {
          console.error('Medication items creation error:', medicationItemsError);
          throw new Error(`Failed to create medication items: ${medicationItemsError.message}`);
        }
      }

      toast({
        title: "Success",
        description: `Bill finalized successfully! Bill ID: ${billData.id}`,
      });

      // Clear the form
      setServiceItems([]);
      setMedicationItems([]);
      setDiscount(0);
      setDiscountReason('');

      onBillFinalized();
    } catch (error) {
      console.error('Error finalizing bill:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Error",
        description: `Failed to finalize bill: ${errorMessage}`,
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
          {/* Enhanced Service Selector */}
          <EnhancedServiceSelector
            serviceItems={serviceItems}
            setServiceItems={setServiceItems}
            discount={discount}
            setDiscount={setDiscount}
            discountReason={discountReason}
            setDiscountReason={setDiscountReason}
          />

          {/* Medication Selector */}
          <MedicationSelector
            medicationItems={medicationItems}
            setMedicationItems={setMedicationItems}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => setShowPreviewDialog(true)} 
              variant="outline" 
              className="flex-1"
              disabled={serviceItems.length === 0 && medicationItems.length === 0}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Bill
            </Button>
            <Button 
              onClick={finalizeBill} 
              className="flex-1"
              disabled={(serviceItems.length === 0 && medicationItems.length === 0) || isFinalizingBill}
            >
              {isFinalizingBill ? "Finalizing..." : "Finalize Bill"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Bill Preview Dialog */}
      {showPreviewDialog && (
        <SimpleBillPreviewDialog
          open={showPreviewDialog}
          onOpenChange={setShowPreviewDialog}
          serviceItems={serviceItems}
          medicationItems={medicationItems}
          subtotal={calculateSubtotal()}
          discount={discount}
          discountAmount={calculateDiscountAmount()}
          total={calculateTotal()}
          onFinalize={() => {
            setShowPreviewDialog(false);
            finalizeBill();
          }}
        />
      )}
    </>
  );
};