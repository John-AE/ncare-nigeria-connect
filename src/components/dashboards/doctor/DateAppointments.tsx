import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInYears } from "date-fns";
import { cn } from "@/lib/utils";

export const DateAppointments = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<any[]>([]);
  const [selectedDateCount, setSelectedDateCount] = useState(0);

  // Fetch appointments for selected date
  useEffect(() => {
    if (selectedDate) {
      fetchSelectedDateAppointments();
    }
  }, [selectedDate]);

  const fetchSelectedDateAppointments = async () => {
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      const { data: appointmentsData, count } = await supabase
        .from('appointments')
        .select(`
          *,
          patients(first_name, last_name, date_of_birth, gender)
        `, { count: 'exact' })
        .eq('scheduled_date', dateString)
        .eq('status', 'scheduled')
        .order('start_time');

      setSelectedDateAppointments(appointmentsData || []);
      setSelectedDateCount(count || 0);
    } catch (error) {
      console.error('Error fetching selected date appointments:', error);
    }
  };

  return (
    <Card className="transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
      <CardHeader>
        <CardTitle>Appointments by Date</CardTitle>
        <CardDescription>Select a date to view appointments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Appointments</h4>
            <Badge variant="secondary">{selectedDateCount} appointments</Badge>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedDateAppointments.length > 0 ? (
              selectedDateAppointments.map((appointment) => (
                 <div key={appointment.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                   <div className="flex-1">
                     <p className="font-medium">
                       {appointment.patients?.first_name} {appointment.patients?.last_name}
                     </p>
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                       <span>{appointment.start_time} - {appointment.end_time}</span>
                       {appointment.patients?.date_of_birth && (
                         <span>• Age {differenceInYears(new Date(), new Date(appointment.patients.date_of_birth))}</span>
                       )}
                       {appointment.patients?.gender && (
                         <span>• {appointment.patients.gender}</span>
                       )}
                     </div>
                     {appointment.notes && (
                       <p className="text-xs text-muted-foreground">{appointment.notes}</p>
                     )}
                   </div>
                  <Badge variant="outline">
                    {appointment.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No appointments for {format(selectedDate, "PPP")}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};