import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Eye } from "lucide-react";
import BillDetailsDialog from "./BillDetailsDialog";


interface BillItem {
  id: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CompletedAppointmentBill {
  appointment_id: string;
  patient_name: string;
  appointment_time: string;
  bill_amount: number;
  is_paid: boolean;
  bill_id: string;
  payment_method?: string;
  bill_items: BillItem[];
  patient_email?: string;
}

const CompletedAppointmentsBills = () => {
  const [completedAppointments, setCompletedAppointments] = useState<CompletedAppointmentBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<CompletedAppointmentBill | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchCompletedAppointments = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get all bills created today with patient information
        const { data: bills, error } = await supabase
          .from('bills')
          .select(`
            id,
            amount,
            is_paid,
            payment_method,
            patient_id,
            created_at,
            patients!inner(first_name, last_name, email),
            bill_items(
              id,
              quantity,
              unit_price,
              total_price,
              service_id,
              medication_id,
              services(name),
              medications(name)
            )
          `)
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Format the data to show all bills
        const formattedData: CompletedAppointmentBill[] = bills?.map(bill => {
          // Calculate total from bill items
          const billItems: BillItem[] = bill.bill_items?.map(item => ({
            id: item.id,
            service_name: item.services?.name || item.medications?.name || 'Unknown Item',
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          })) || [];
          
          const calculatedTotal = billItems.reduce((sum, item) => sum + item.total_price, 0);
          
          return {
            appointment_id: bill.id, // Using bill ID as appointment ID
            patient_name: `${bill.patients.first_name} ${bill.patients.last_name}`,
            appointment_time: new Date(bill.created_at).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            bill_amount: calculatedTotal || bill.amount || 0,
            is_paid: bill.is_paid || false,
            bill_id: bill.id,
            payment_method: bill.payment_method,
            bill_items: billItems,
            patient_email: bill.patients.email,
          };
        }) || [];

        setCompletedAppointments(formattedData);
      } catch (error) {
        console.error('Error fetching completed appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedAppointments();
  }, []);

  const refetchData = () => {
    setLoading(true);
    const fetchCompletedAppointments = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: bills, error } = await supabase
          .from('bills')
          .select(`
            id,
            amount,
            is_paid,
            payment_method,
            patient_id,
            created_at,
            patients!inner(first_name, last_name, email),
            bill_items(
              id,
              quantity,
              unit_price,
              total_price,
              service_id,
              medication_id,
              services(name),
              medications(name)
            )
          `)
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedData: CompletedAppointmentBill[] = bills?.map(bill => {
          const billItems: BillItem[] = bill.bill_items?.map(item => ({
            id: item.id,
            service_name: item.services?.name || item.medications?.name || 'Unknown Item',
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          })) || [];
          
          const calculatedTotal = billItems.reduce((sum, item) => sum + item.total_price, 0);
          
          return {
            appointment_id: bill.id,
            patient_name: `${bill.patients.first_name} ${bill.patients.last_name}`,
            appointment_time: new Date(bill.created_at).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            bill_amount: calculatedTotal || bill.amount || 0,
            is_paid: bill.is_paid || false,
            bill_id: bill.id,
            payment_method: bill.payment_method,
            bill_items: billItems,
            patient_email: bill.patients.email,
          };
        }) || [];

        setCompletedAppointments(formattedData);
      } catch (error) {
        console.error('Error fetching completed appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedAppointments();
  };

  const totalBillAmount = completedAppointments.reduce((sum, apt) => sum + apt.bill_amount, 0);

  const handleBillClick = (appointment: CompletedAppointmentBill) => {
    setSelectedBill(appointment);
    setDialogOpen(true);
  };


  return (
    <>
      <Card className="h-fit border-l-8 border-l-[#65A30D]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">
            Today's Completed Appointments & Bills Generated
          </CardTitle>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {completedAppointments.length} completed
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : completedAppointments.length === 0 ? (
            <div className="text-sm text-muted-foreground">No completed appointments today</div>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {completedAppointments.map((apt) => (
                  <div 
                    key={apt.appointment_id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleBillClick(apt)}
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{apt.patient_name}</p>
                      <p className="text-xs text-muted-foreground">{apt.appointment_time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">₦{apt.bill_amount.toLocaleString()}</span>
                      </div>
                      <Badge variant={apt.is_paid ? "default" : "secondary"} className="text-xs">
                        {apt.is_paid ? "Paid" : "Pending"}
                      </Badge>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Bills Generated:</span>
                  <span className="text-sm font-bold">₦{totalBillAmount.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {selectedBill && (
        <BillDetailsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          patientName={selectedBill.patient_name}
          appointmentTime={selectedBill.appointment_time}
          billItems={selectedBill.bill_items}
          totalAmount={selectedBill.bill_amount}
          isPaid={selectedBill.is_paid}
          paymentMethod={selectedBill.payment_method}
          billId={selectedBill.bill_id}
          patientEmail={selectedBill.patient_email}
        />
      )}

    </>
  );
};

export default CompletedAppointmentsBills;