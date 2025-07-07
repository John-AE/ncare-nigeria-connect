import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const DoctorDashboard = () => {
  const { profile } = useAuth();
  const [todaysAppointments, setTodaysAppointments] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [pendingBills, setPendingBills] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [todaysSchedule, setTodaysSchedule] = useState<any[]>([]);
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
          patients(first_name, last_name)
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

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get today's appointments count
        const { count: appointmentsCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('scheduled_date', today)
          .eq('status', 'scheduled');
        
        // Get total patients count
        const { count: patientsCount } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true });
        
        // Get pending bills count
        const { count: billsCount } = await supabase
          .from('bills')
          .select('*', { count: 'exact', head: true })
          .eq('is_paid', false);
        
        // Get total revenue (sum of paid bills)
        const { data: revenueData } = await supabase
          .from('bills')
          .select('amount_paid')
          .eq('is_paid', true);
        
        // Get today's schedule with patient details
        const { data: scheduleData } = await supabase
          .from('appointments')
          .select(`
            *,
            patients(first_name, last_name)
          `)
          .eq('scheduled_date', today)
          .eq('status', 'scheduled')
          .order('start_time');

        setTodaysAppointments(appointmentsCount || 0);
        setTotalPatients(patientsCount || 0);
        setPendingBills(billsCount || 0);
        setTotalRevenue(revenueData?.reduce((sum, bill) => sum + Number(bill.amount_paid), 0) || 0);
        setTodaysSchedule(scheduleData || []);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();

    // Set up real-time listeners
    const patientsChannel = supabase
      .channel('patients-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'patients' },
        () => setTotalPatients(prev => prev + 1)
      )
      .subscribe();

    const billsChannel = supabase
      .channel('bills-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bills' },
        (payload) => {
          if (!payload.new.is_paid) {
            setPendingBills(prev => prev + 1);
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bills' },
        (payload) => {
          const oldRecord = payload.old;
          const newRecord = payload.new;
          
          // If bill status changed from unpaid to paid
          if (!oldRecord.is_paid && newRecord.is_paid) {
            setPendingBills(prev => prev - 1);
            setTotalRevenue(prev => prev + Number(newRecord.amount_paid));
          }
          // If bill status changed from paid to unpaid
          else if (oldRecord.is_paid && !newRecord.is_paid) {
            setPendingBills(prev => prev + 1);
            setTotalRevenue(prev => prev - Number(oldRecord.amount_paid));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(patientsChannel);
      supabase.removeChannel(billsChannel);
    };
  }, []);

  const quickStats = [
    { label: "Today's Appointments", value: todaysAppointments.toString(), color: "bg-primary" },
    { label: "Total Patients", value: totalPatients.toString(), color: "bg-secondary" },
    { label: "Pending Bills", value: pendingBills.toString(), color: "bg-destructive" },
    { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, color: "bg-primary" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold text-foreground">Doctor Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Dr. {profile?.username}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`h-10 w-10 rounded-full ${stat.color} flex items-center justify-center`}>
                  <span className="text-lg font-bold text-white">{stat.value}</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Date Selector and Appointments */}
        <Card>
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
                        <p className="text-sm text-muted-foreground">
                          {appointment.start_time} - {appointment.end_time}
                        </p>
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

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Schedule</CardTitle>
            <CardDescription>Scheduled appointments for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysSchedule.length > 0 ? (
                todaysSchedule.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">
                        {appointment.patients?.first_name} {appointment.patients?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.start_time} - {appointment.end_time}
                      </p>
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
                <p className="text-muted-foreground text-center py-4">No appointments scheduled for today</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorDashboard;