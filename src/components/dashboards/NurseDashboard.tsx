import { useState } from "react";
import { useAuth } from "../AuthProvider";
import { useNurseDashboardStats } from "@/hooks/useNurseDashboardStats";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NurseStatsCards } from "./nurse/NurseStatsCards";
import { PatientManagement } from "./nurse/PatientManagement";
import { AppointmentManagement } from "./nurse/AppointmentManagement";
import { DateAppointments } from "./doctor/DateAppointments";
import { ScheduledPatientsQueue } from "./nurse/ScheduledPatientsQueue";
import { RecentRegistrations } from "./nurse/RecentRegistrations";
import { TriageQueue } from "./nurse/TriageQueue";
import { CompletedConsultations } from "./nurse/CompletedConsultations";
import PatientRegistrationForm from "../PatientRegistrationForm";
import AppointmentSchedulingForm from "../AppointmentSchedulingForm";
import RecurringAppointmentForm from "../RecurringAppointmentForm";

const NurseDashboard = () => {
  const { profile } = useAuth();
  const stats = useNurseDashboardStats();
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    window.location.reload();
  };

  const handlePatientRegistrationSuccess = () => {
    // Trigger refresh of the Recent Registrations component
    setRefreshKey(prev => prev + 1);
  };

  const handlePatientArrived = () => {
    // Trigger refresh of components when a patient is marked as arrived
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Nurse Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.username}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <NurseStatsCards stats={stats} />

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PatientManagement
          onRegisterPatient={() => setShowPatientForm(true)}
          onScheduleAppointment={() => setShowAppointmentForm(true)}
          onPatientSelect={setSelectedPatient}
        />

        <AppointmentManagement
          onScheduleAppointment={() => setShowAppointmentForm(true)}
          onSetupRecurring={() => setShowRecurringForm(true)}
        />
      </div>

      {/* Full Width Cards */}
      <div className="space-y-6">
        <DateAppointments onPatientArrived={handlePatientArrived} />
        <ScheduledPatientsQueue key={`queue-${refreshKey}`} />
        <RecentRegistrations key={`recent-${refreshKey}`} />
        <TriageQueue key={`triage-${refreshKey}`} />
        <CompletedConsultations />
      </div>

      <PatientRegistrationForm
        isOpen={showPatientForm}
        onClose={() => setShowPatientForm(false)}
        onSuccess={handlePatientRegistrationSuccess}
      />
      
      <AppointmentSchedulingForm
        isOpen={showAppointmentForm}
        onClose={() => {
          setShowAppointmentForm(false);
          setSelectedPatient(null);
        }}
        preSelectedPatient={selectedPatient}
      />
      
      <RecurringAppointmentForm
        isOpen={showRecurringForm}
        onClose={() => setShowRecurringForm(false)}
      />
    </div>
  );
};

export default NurseDashboard;