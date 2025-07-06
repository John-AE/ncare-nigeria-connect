import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import PatientRegistrationForm from "../PatientRegistrationForm";
import AppointmentSchedulingForm from "../AppointmentSchedulingForm";
import { useAuth } from "../AuthProvider";
import { supabase } from "@/integrations/supabase/client";

const NurseDashboard = () => {
  const { profile } = useAuth();
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalPendingBills, setTotalPendingBills] = useState(0);

  // Fetch total patients and pending bills
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total patients
        const { count: patientCount } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true });
        
        // Get total pending bills
        const { count: billCount } = await supabase
          .from('bills')
          .select('*', { count: 'exact', head: true })
          .eq('is_paid', false);
        
        setTotalPatients(patientCount || 0);
        setTotalPendingBills(billCount || 0);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  // Fetch all patients for search
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setPatients(data || []);
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };

    fetchPatients();
  }, []);

  // Filter patients based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPatients([]);
    } else {
      const filtered = patients.filter(patient =>
        `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPatients(filtered);
    }
  }, [searchQuery, patients]);

  const quickStats = [
    { label: "Total Patients", value: totalPatients.toString(), color: "bg-primary" },
    { label: "Total Pending Bills", value: totalPendingBills.toString(), color: "bg-destructive" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold text-foreground">Nurse Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.username}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <CardDescription>Register new patients and search existing records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full justify-start" 
              size="lg"
              onClick={() => setShowPatientForm(true)}
            >
              Register New Patient
            </Button>
            
            <div className="space-y-3">
              <div>
                <Input
                  placeholder="Search patients by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              
              {filteredPatients.length > 0 && (
                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
                  {filteredPatients.map((patient) => (
                    <div 
                      key={patient.id} 
                      className="p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                      <p className="text-sm text-muted-foreground">
                        DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedPatient && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/20">
                  <h4 className="font-semibold mb-3">{selectedPatient.first_name} {selectedPatient.last_name}</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Email:</span> {selectedPatient.email || 'N/A'}</p>
                    <p><span className="font-medium">Phone:</span> {selectedPatient.phone || 'N/A'}</p>
                    <p><span className="font-medium">Gender:</span> {selectedPatient.gender}</p>
                    <p><span className="font-medium">Blood Group:</span> {selectedPatient.blood_group || 'N/A'}</p>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowAppointmentForm(true)}
                    >
                      Schedule Appointment
                    </Button>
                    <Button size="sm" variant="outline">Print History</Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Scheduling</CardTitle>
            <CardDescription>Book and manage doctor appointments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              size="lg"
              onClick={() => setShowAppointmentForm(true)}
            >
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
      </div>

      <PatientRegistrationForm
        isOpen={showPatientForm}
        onClose={() => setShowPatientForm(false)}
      />
      
      <AppointmentSchedulingForm
        isOpen={showAppointmentForm}
        onClose={() => setShowAppointmentForm(false)}
      />
    </div>
  );
};

export default NurseDashboard;