import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DoctorDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const quickStats = [
    { label: "Today's Appointments", value: "15", color: "bg-primary" },
    { label: "Pending Diagnoses", value: "3", color: "bg-accent" },
    { label: "Bills Generated", value: "8", color: "bg-secondary" },
    { label: "Follow-ups Scheduled", value: "5", color: "bg-primary" }
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
        <p className="text-muted-foreground">Welcome back, Dr. {user.username}</p>
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

        {/* Recent Diagnoses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Diagnoses</CardTitle>
            <CardDescription>Completed consultations and billing status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDiagnoses.map((record, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{record.patient}</p>
                    <p className="text-sm text-muted-foreground">{record.diagnosis}</p>
                    <p className="text-xs text-muted-foreground">{record.time}</p>
                  </div>
                  <Badge variant={record.billStatus === "Generated" ? "default" : "secondary"}>
                    Bill {record.billStatus}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorDashboard;