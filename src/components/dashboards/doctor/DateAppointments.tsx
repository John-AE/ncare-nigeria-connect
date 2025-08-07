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

function BeautifulDatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    date ? new Date(date.getFullYear(), date.getMonth(), 1) : new Date()
  );
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

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isSelected = (day: Date) => {
    return date && day.toDateString() === date.toDateString();
  };

  const handleDateSelect = (selectedDate: Date) => {
    onDateChange(selectedDate);
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newMonth;
    });
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "relative w-full pl-10 pr-4 py-3 bg-white border-2 rounded-xl shadow-sm transition-all duration-200 cursor-pointer",
          "hover:shadow-md focus-within:shadow-lg",
          isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20"
            : "border-gray-200 hover:border-gray-300",
          disabled && "opacity-50 cursor-not-allowed bg-gray-50"
        )}
      >
        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={date ? formatDate(date) : ""}
          placeholder={placeholder}
          readOnly
          className="w-full bg-transparent outline-none text-sm font-medium text-gray-900 placeholder-gray-500 cursor-pointer"
          disabled={disabled}
        />
        <div className={cn(
          "absolute right-3 top-1/2 transform -translate-y-1/2 transition-transform duration-200",
          isOpen && "rotate-180"
        )}>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 rounded-lg hover:bg-white/50 transition-colors duration-150"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 rounded-lg hover:bg-white/50 transition-colors duration-150"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((day, index) => {
                const isCurrentMonth = isSameMonth(day);
                const isTodayDate = isToday(day);
                const isSelectedDate = isSelected(day);

                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(day)}
                    className={cn(
                      "relative h-10 w-full rounded-lg text-sm font-medium transition-all duration-150",
                      "hover:bg-blue-50 hover:scale-105 active:scale-95",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                      isCurrentMonth ? "text-gray-900" : "text-gray-300",
                      isTodayDate && "bg-blue-100 text-blue-800 font-bold",
                      isSelectedDate && "bg-blue-600 text-white shadow-md hover:bg-blue-700",
                      !isCurrentMonth && "hover:bg-gray-100"
                    )}
                  >
                    {day.getDate()}
                    {isTodayDate && !isSelectedDate && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {date && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button
                  onClick={() => {
                    onDateChange(null);
                    setIsOpen(false);
                  }}
                  className="w-full py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-150"
                >
                  Clear Date
                </button>
              </div>
            )}
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
          <BeautifulDatePicker
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
              <BeautifulDatePicker
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