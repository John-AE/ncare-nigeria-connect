import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign } from "lucide-react";

interface CompletedAppointmentBill {
  appointment_id: string;
  patient_name: string;
  appointment_time: string;
  bill_amount: number;
  is_paid: boolean;
}

const CompletedAppointmentsBills = () => {
  const [completedAppointments, setCompletedAppointments] = useState<CompletedAppointmentBill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedAppointments = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            start_time,
            patient_id,
            patients!inner(first_name, last_name)
          `)
          .eq('scheduled_date', today)
          .eq('status', 'completed');

        if (error) throw error;

        // Get bills for completed appointments
        const patientIds = data?.map(apt => apt.patient_id) || [];
        
        let billsData = [];
        if (patientIds.length > 0) {
          const { data: bills } = await supabase
            .from('bills')
            .select('amount, is_paid, patient_id')
            .in('patient_id', patientIds);
            
          billsData = bills || [];
        }

        const formattedData: CompletedAppointmentBill[] = data?.map(apt => {
          const patientBill = billsData.find(bill => bill.patient_id === apt.patient_id);
          return {
            appointment_id: apt.id,
            patient_name: `${apt.patients.first_name} ${apt.patients.last_name}`,
            appointment_time: apt.start_time,
            bill_amount: patientBill?.amount || 0,
            is_paid: patientBill?.is_paid || false,
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

  const totalBillAmount = completedAppointments.reduce((sum, apt) => sum + apt.bill_amount, 0);

  return (
    <Card className="h-fit">
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
            <div className="space-y-3">
              {completedAppointments.map((apt) => (
                <div key={apt.appointment_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{apt.patient_name}</p>
                    <p className="text-xs text-muted-foreground">{apt.appointment_time}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium">${apt.bill_amount.toFixed(2)}</span>
                    </div>
                    <Badge variant={apt.is_paid ? "default" : "secondary"} className="text-xs">
                      {apt.is_paid ? "Paid" : "Pending"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Bills Generated:</span>
                <span className="text-sm font-bold">${totalBillAmount.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CompletedAppointmentsBills;