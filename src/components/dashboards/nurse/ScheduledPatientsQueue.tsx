import { useState, useEffect } from "react";
import { format, differenceInYears } from "date-fns";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { VitalsRecordingDialog } from "./VitalsRecordingDialog";

interface ArrivedPatient {
  id: string;
  start_time: string;
  end_time: string;
  scheduled_date: string;
  notes?: string;
  patients: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
  };
}

export const ScheduledPatientsQueue = () => {
  const [arrivedPatients, setArrivedPatients] = useState<ArrivedPatient[]>([]);
  const [showVitalsDialog, setShowVitalsDialog] = useState(false);
  const [vitalsPatient, setVitalsPatient] = useState<any>(null);

  useEffect(() => {
    fetchArrivedPatients();
    
    // Set up real-time listener for appointment updates
    const channel = supabase
      .channel('arrived-patients-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments'
        },
        () => {
          fetchArrivedPatients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchArrivedPatients = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          scheduled_date,
          notes,
          patients (
            id,
            first_name,
            last_name,
            date_of_birth,
            gender
          )
        `)
        .eq('status', 'arrived')
        .eq('scheduled_date', today)
        .order('start_time');

      if (error) {
        console.error('Error fetching arrived patients:', error);
      } else {
        setArrivedPatients(data || []);
      }
    } catch (error) {
      console.error('Error fetching arrived patients:', error);
    }
  };

  const handleRecordVitals = (patient: any) => {
    setVitalsPatient(patient);
    setShowVitalsDialog(true);
  };

  const handleCloseVitals = () => {
    setShowVitalsDialog(false);
    setVitalsPatient(null);
  };

  return (
    <>
      <Card className="bg-card border-border transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">Scheduled Patients Queue</CardTitle>
            <Badge variant="secondary">{arrivedPatients.length} patients</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/50">
                  <TableHead className="font-medium text-muted-foreground">Patient Name</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Age</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Gender</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Appointment Time</TableHead>
                  <TableHead className="font-medium text-muted-foreground w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arrivedPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No patients in queue
                    </TableCell>
                  </TableRow>
                ) : (
                  arrivedPatients.map((appointment) => (
                    <TableRow 
                      key={appointment.id} 
                      className="border-border hover:bg-muted/50 transition-all duration-200 hover:scale-[1.01] hover:shadow-sm"
                    >
                      <TableCell className="font-medium text-foreground">
                        {appointment.patients.first_name} {appointment.patients.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {differenceInYears(new Date(), new Date(appointment.patients.date_of_birth))} years
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {appointment.patients.gender}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(`2000-01-01T${appointment.start_time}`), 'h:mm a')} - {format(new Date(`2000-01-01T${appointment.end_time}`), 'h:mm a')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRecordVitals(appointment.patients)}
                          className="h-8 px-3 text-xs"
                        >
                          <Activity className="h-3 w-3 mr-1" />
                          Record Vitals
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <VitalsRecordingDialog
        isOpen={showVitalsDialog}
        onClose={handleCloseVitals}
        patient={vitalsPatient}
      />
    </>
  );
};