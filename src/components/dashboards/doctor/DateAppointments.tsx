import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, UserCheck, Calendar as CalendarClock, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInYears } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function CompactDatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const quickDates = [
    { label: "Today", date: today },
    { label: "Tomorrow", date: tomorrow },
    { label: "Next Week", date: nextWeek },
  ];

  const handleDateSelect = (selectedDate: Date) => {
    onDateChange(selectedDate);
    setIsOpen(false);
  };

  const handleCustomDate = () => {
    const dateString = prompt('Enter date (YYYY-MM-DD):');
    if (dateString) {
      const selectedDate = new Date(dateString + 'T00:00:00');
      if (!isNaN(selectedDate.getTime())) {
        handleDateSelect(selectedDate);
      }
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "relative w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg shadow-sm transition-all duration-200 cursor-pointer",
          "hover:shadow-md hover:border-blue-300",
          isOpen
            ? "border-blue-500 ring-1 ring-blue-500/20"
            : "border-gray-300",
          disabled && "opacity-50 cursor-not-allowed bg-gray-50"
        )}
      >
        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          type="text"
          value={date ? formatDate(date) : ""}
          placeholder={placeholder}
          readOnly
          className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500 cursor-pointer"
          disabled={disabled}
        />
        <ChevronRight className={cn(
          "absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform duration-200",
          isOpen && "rotate-90"
        )} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-3 space-y-1">
            {quickDates.map((item, index) => (
              <button
                key={index}
                onClick={() => handleDateSelect(item.date)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-150",
                  "hover:bg-blue-50 hover:text-blue-700",
                  date && item.date.toDateString() === date.toDateString() 
                    ? "bg-blue-100 text-blue-700 font-medium" 
                    : "text-gray-700"
                )}
              >
                <div className="flex justify-between items-center">
                  <span>{item.label}</span>
                  <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
                </div>
              </button>
            ))}
            
            <div className="border-t border-gray-200 pt-2 mt-2">
              <button
                onClick={handleCustomDate}
                className="w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-150 hover:bg-gray-50 text-gray-700"
              >
                Custom Date...
              </button>
              
              {date && (
                <button
                  onClick={() => {
                    onDateChange(null);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-150 hover:bg-red-50 text-red-600"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DateAppointmentsProps {
  onPatientArrived?: () => void;
  refreshTrigger?: React.MutableRefObject<(() => void) | null>;
}

export const DateAppointments = ({ onPatientArrived, refreshTrigger }: DateAppointmentsProps) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<any[]>([]);
  const [selectedDateCount, setSelectedDateCount] = useState(0);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

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
        .in('status', ['scheduled', 'arrived'])
        .order('start_time');

      setSelectedDateAppointments(appointmentsData || []);
      setSelectedDateCount(count || 0);
    } catch (error) {
      console.error('Error fetching selected date appointments:', error);
    }
  };

  useEffect(() => {
    if (refreshTrigger) {
      refreshTrigger.current = fetchSelectedDateAppointments;
    }
  }, [refreshTrigger, fetchSelectedDateAppointments]);

  useEffect(() => {
    if (selectedDate) {
      fetchSelectedDateAppointments();
    }
  }, [selectedDate, fetchSelectedDateAppointments]);

  useEffect(() => {
    const channel = supabase
      .channel('appointment-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments'
        },
        () => {
          fetchSelectedDateAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate, fetchSelectedDateAppointments]);

  const markAsArrived = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'arrived' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Patient marked as arrived",
      });

      fetchSelectedDateAppointments();
      
      setTimeout(() => {
        if (onPatientArrived) {
          onPatientArrived();
        }
      }, 2000);
    } catch (error) {
      console.error('Error marking patient as arrived:', error);
      toast({
        title: "Error",
        description: "Failed to mark patient as arrived. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment cancelled successfully",
      });

      fetchSelectedDateAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const rescheduleAppointment = async () => {
    if (!selectedAppointment || !newDate || !newStartTime || !newEndTime) {
      toast({
        title: "Error",
        description: "Please fill in all fields for rescheduling.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          scheduled_date: format(newDate, 'yyyy-MM-dd'),
          start_time: newStartTime,
          end_time: newEndTime
        })
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment rescheduled successfully",
      });

      setRescheduleDialogOpen(false);
      setSelectedAppointment(null);
      setNewDate(undefined);
      setNewStartTime('');
      setNewEndTime('');
      fetchSelectedDateAppointments();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to reschedule appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openRescheduleDialog = (appointment: any) => {
    setSelectedAppointment(appointment);
    setNewDate(new Date(appointment.scheduled_date));
    setNewStartTime(appointment.start_time);
    setNewEndTime(appointment.end_time);
    setRescheduleDialogOpen(true);
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
          <CompactDatePicker
            date={selectedDate}
            onDateChange={(date) => date && setSelectedDate(date)}
            placeholder="Pick a date"
          />
        </div>
        
        <div className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Appointments</h4>
            <Badge variant="secondary">{selectedDateCount} appointments</Badge>
          </div>
          
          <div 
            className="space-y-2 overflow-y-auto" 
            style={{ 
              maxHeight: selectedDateAppointments.length > 3 ? '280px' : 'auto',
              height: selectedDateAppointments.length > 0 ? 'auto' : '120px'
            }}
          >
            {selectedDateAppointments.length > 0 ? (
              selectedDateAppointments.map((appointment) => (
                 <div key={appointment.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                   <div className="flex-1">
                     <div className="flex items-center gap-2 flex-wrap">
                       <p className="font-medium">
                         {appointment.patients?.first_name} {appointment.patients?.last_name}
                       </p>
                       {appointment.patients?.date_of_birth && (
                         <span className="text-sm text-muted-foreground">
                           Age {differenceInYears(new Date(), new Date(appointment.patients.date_of_birth))}
                         </span>
                       )}
                       {appointment.patients?.gender && (
                         <span className="text-sm text-muted-foreground">• {appointment.patients.gender}</span>
                       )}
                     </div>
                     <p className="text-sm text-muted-foreground">
                       {format(new Date(`2000-01-01T${appointment.start_time}`), 'h:mm a')} - {format(new Date(`2000-01-01T${appointment.end_time}`), 'h:mm a')}
                     </p>
                     {appointment.notes && (
                       <p className="text-xs text-muted-foreground">{appointment.notes}</p>
                     )}
                   </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={appointment.status === 'arrived' ? 'default' : 'outline'}>
                        {appointment.status}
                      </Badge>
                      {appointment.status === 'scheduled' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsArrived(appointment.id)}
                            className="text-xs"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            Mark Arrived
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRescheduleDialog(appointment)}
                            className="text-xs"
                          >
                            <CalendarClock className="h-3 w-3 mr-1" />
                            Reschedule
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelAppointment(appointment.id)}
                            className="text-xs"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
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

      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Reschedule appointment for {selectedAppointment?.patients?.first_name} {selectedAppointment?.patients?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>New Date</Label>
              <CompactDatePicker
                date={newDate}
                onDateChange={setNewDate}
                placeholder="Pick a date"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={rescheduleAppointment}>
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};