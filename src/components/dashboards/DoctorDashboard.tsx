import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useAuth } from "../AuthProvider";
import { supabase } from "@/integrations/supabase/client";

const DoctorDashboard = () => {
  const { profile } = useAuth();
  const [todaysAppointments, setTodaysAppointments] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [pendingBills, setPendingBills] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [todaysSchedule, setTodaysSchedule] = useState<any[]>([]);

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
  }, []);

  const quickStats = [
    { label: "Today's Appointments", value: todaysAppointments.toString(), color: "bg-primary" },
    { label: "Total Patients", value: totalPatients.toString(), color: "bg-secondary" },
    { label: "Pending Bills", value: pendingBills.toString(), color: "bg-destructive" },
    { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, color: "bg-primary" }
  ];

  const upcomingAppointments = [
    { patient: "Sarah Wilson", time: "2:00 PM", complaint: "Chest pain", priority: "High" },
    { patient: "David Brown", time: "2:15 PM", complaint: "Routine checkup", priority: "Low" },
    { patient: "Emma Davis", time: "2:30 PM", complaint: "Headache", priority: "Medium" }
  ];

  const recentDiagnoses = [
    { patient: "John Doe", diagnosis: "Hypertension", time: "1:30 PM", billStatus: "Generated" },
    { patient: "Jane Smith", diagnosis: "Common Cold", time: "1:15 PM", billStatus: "Pending" },
    { patient: "Mike Johnson", diagnosis: "Diabetes Follow-up", time: "1:00 PM", billStatus: "Generated" }
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
        {/* Patient Consultations */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Consultations</CardTitle>
            <CardDescription>Manage patient visits and medical records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" size="lg">
              Start New Consultation
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              View Patient History
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              Enter Diagnosis
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              Prescribe Medication
            </Button>
          </CardContent>
        </Card>

        {/* Billing & Services */}
        <Card>
          <CardHeader>
            <CardTitle>Billing & Medical Services</CardTitle>
            <CardDescription>Generate bills and manage service catalog</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" size="lg">
              Create New Bill
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              View Service Catalog
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              Review Generated Bills
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              Update Service Prices
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Next scheduled patient visits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAppointments.map((appointment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{appointment.patient}</p>
                    <p className="text-sm text-muted-foreground">{appointment.complaint}</p>
                    <p className="text-xs text-muted-foreground">{appointment.time}</p>
                  </div>
                  <Badge variant={appointment.priority === "High" ? "destructive" : 
                                 appointment.priority === "Medium" ? "secondary" : "outline"}>
                    {appointment.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
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