import { useState } from "react";
import { useAuth } from "../AuthProvider";
import { useNurseDashboardStats } from "@/hooks/useNurseDashboardStats";
import { NurseStatsCards } from "./nurse/NurseStatsCards";
import { PatientManagement } from "./nurse/PatientManagement";
import { AppointmentManagement } from "./nurse/AppointmentManagement";
import { DateAppointments } from "./doctor/DateAppointments";
import { RecentRegistrations } from "./nurse/RecentRegistrations";
import { TriageQueue } from "./nurse/TriageQueue";
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold text-foreground">Nurse Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.username}</p>
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
        <DateAppointments />
        <RecentRegistrations 
          onScheduleAppointment={(patient) => {
            setSelectedPatient(patient);
            setShowAppointmentForm(true);
          }}
        />
        <TriageQueue />
      </div>

      <PatientRegistrationForm
        isOpen={showPatientForm}
        onClose={() => setShowPatientForm(false)}
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