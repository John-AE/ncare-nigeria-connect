import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import PatientRegistrationForm from "../PatientRegistrationForm";
import { useAuth } from "../AuthProvider";

const NurseDashboard = () => {
  const { profile } = useAuth();
  const [showPatientForm, setShowPatientForm] = useState(false);

  const quickStats = [
    { label: "Patients Today", value: "12", color: "bg-primary" },
    { label: "Pending Checkups", value: "5", color: "bg-accent" },
    { label: "Scheduled Appointments", value: "8", color: "bg-secondary" },
    { label: "Emergency Cases", value: "2", color: "bg-destructive" }
  ];

  const recentPatients = [
    { name: "John Doe", time: "09:30 AM", status: "Completed" },
    { name: "Jane Smith", time: "10:15 AM", status: "In Progress" },
    { name: "Michael Johnson", time: "11:00 AM", status: "Waiting" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold text-foreground">Nurse Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.username}</p>
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

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Management</CardTitle>
            <CardDescription>Register new patients and manage records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              size="lg"
              onClick={() => setShowPatientForm(true)}
            >
              Register New Patient
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              View Patient Records
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              Update Patient Information
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preliminary Checkups</CardTitle>
            <CardDescription>Record vital signs and measurements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" size="lg">
              Record Vital Signs
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              View Checkup History
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              Print Checkup Reports
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Scheduling</CardTitle>
            <CardDescription>Book and manage doctor appointments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" size="lg">
              Schedule New Appointment
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              View Today's Schedule
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              Reschedule Appointments
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
            <CardDescription>Today's patient activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPatients.map((patient, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">{patient.time}</p>
                  </div>
                  <Badge variant={patient.status === "Completed" ? "default" : 
                                 patient.status === "In Progress" ? "secondary" : "outline"}>
                    {patient.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <PatientRegistrationForm
        isOpen={showPatientForm}
        onClose={() => setShowPatientForm(false)}
      />
    </div>
  );
};

export default NurseDashboard;