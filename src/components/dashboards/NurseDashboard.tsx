/**
 * Nurse Dashboard Component
 * 
 * Central workspace for nursing staff featuring:
 * - Patient registration and management
 * - Appointment scheduling and coordination
 * - Vital signs recording and triage assessment
 * - Patient queue management
 * - Consultation tracking and follow-up
 * 
 * This dashboard serves as the primary interface for nurses to manage
 * the entire patient intake and care coordination process.
 * 
 * @author NCare Nigeria Development Team
 */

import { useState } from "react";
import { useAuth } from "../AuthProvider";
import { useNurseDashboardStats } from "@/hooks/useNurseDashboardStats";
import { useRefreshManager } from "@/hooks/useRefreshManager";
import { useModalState } from "@/hooks/useModalState";

// Nurse-specific dashboard components
import { NurseStatsCards } from "./nurse/NurseStatsCards";
import { PatientManagement } from "./nurse/PatientManagement";
import { AppointmentManagement } from "./nurse/AppointmentManagement";
import { ScheduledPatientsQueue } from "./nurse/ScheduledPatientsQueue";
import { RecentRegistrations } from "./nurse/RecentRegistrations";
import { TriageQueue } from "./nurse/TriageQueue";
import { CompletedConsultations } from "./nurse/CompletedConsultations";

// Shared components
import { DateAppointments } from "./doctor/DateAppointments";
import { DashboardToggle } from "../DashboardToggle";
import { PatientTimelineView } from "../PatientTimelineView";
import { DashboardHeader } from "../shared/DashboardHeader";
import { InpatientManagement } from "@/components/inpatient/InpatientManagement";

// Form components for patient and appointment management
import PatientRegistrationForm from "../PatientRegistrationForm";
import AppointmentSchedulingForm from "../AppointmentSchedulingForm";
import RecurringAppointmentForm from "../RecurringAppointmentForm";

const NurseDashboard = () => {
  const { profile } = useAuth();
  const { stats, loading, refetch } = useNurseDashboardStats();
  const [viewMode, setViewMode] = useState<'outpatients' | 'inpatients' | 'timeline'>('outpatients');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  
  const { registerRefresh, triggerRefresh } = useRefreshManager();
  const { 
    openModal, 
    closeModal, 
    closeAllModals, 
    isModalOpen 
  } = useModalState({
    patientForm: false,
    appointmentForm: false,
    recurringForm: false
  });

  const handlePatientRegistrationSuccess = () => {
    triggerRefresh('recentRegistrations');
    closeModal('patientForm');
  };

  const handleVitalsRecorded = () => {
    triggerRefresh('recentRegistrations');
    setTimeout(() => {
      triggerRefresh('triageQueue');
    }, 2000);
  };

  const handlePatientArrived = () => {
    triggerRefresh('dateAppointments');
  };

  const handleAppointmentScheduled = () => {
    triggerRefresh('dateAppointments');
    closeModal('appointmentForm');
    closeModal('recurringForm');
  };

  if (viewMode === 'timeline') {
    return <PatientTimelineView onNavigate={setViewMode} />;
  }

  if (viewMode === 'inpatients') {
    return <InpatientManagement onNavigate={setViewMode} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader
        title="Nurse Dashboard"
        subtitle={`Welcome back, ${profile?.username}`}
      />

      {/* Dashboard Toggle */}
        <DashboardToggle 
          viewMode={viewMode} 
          onToggle={(mode: 'outpatients' | 'inpatients' | 'timeline') => setViewMode(mode)} 
        />

      {/* Quick Stats */}
      <NurseStatsCards stats={stats} />

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PatientManagement
          onRegisterPatient={() => openModal('patientForm')}
          onScheduleAppointment={() => openModal('appointmentForm')}
          onPatientSelect={setSelectedPatient}
        />

        <AppointmentManagement
          onScheduleAppointment={() => openModal('appointmentForm')}
          onSetupRecurring={() => openModal('recurringForm')}
        />
      </div>

      {/* Full Width Cards */}
      <div className="space-y-6">
        <DateAppointments 
          onPatientArrived={handlePatientArrived}
          refreshTrigger={(fn) => registerRefresh('dateAppointments', fn)}
        />
        <ScheduledPatientsQueue />
        <RecentRegistrations 
          refreshTrigger={(fn) => registerRefresh('recentRegistrations', fn)}
          onVitalsRecorded={handleVitalsRecorded}
        />
        <TriageQueue refreshTrigger={(fn) => registerRefresh('triageQueue', fn)} />
        <CompletedConsultations />
      </div>

      <PatientRegistrationForm
        isOpen={isModalOpen('patientForm')}
        onClose={() => closeModal('patientForm')}
        onSuccess={handlePatientRegistrationSuccess}
      />
      
      <AppointmentSchedulingForm
        isOpen={isModalOpen('appointmentForm')}
        onClose={() => {
          closeModal('appointmentForm');
          setSelectedPatient(null);
        }}
        preSelectedPatient={selectedPatient}
        onSuccess={handleAppointmentScheduled}
      />
      
      <RecurringAppointmentForm
        isOpen={isModalOpen('recurringForm')}
        onClose={() => closeModal('recurringForm')}
      />
    </div>
  );
};

export default NurseDashboard;