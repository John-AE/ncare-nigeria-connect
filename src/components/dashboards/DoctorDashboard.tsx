/**
 * Doctor Dashboard Component
 * 
 * Main workspace for doctors featuring:
 * - Patient consultation management
 * - Visit recording and billing
 * - Lab test ordering and results viewing
 * - Appointment scheduling and management
 * - Patient timeline viewing
 * - Triage queue for urgent patients
 * 
 * The dashboard provides a comprehensive view of all doctor-related activities
 * and integrates with other hospital systems for seamless workflow.
 * 
 * @author NCare Nigeria Development Team
 */

import { useState } from "react";
import { useAuth } from "../AuthProvider";
import { useDoctorDashboardStats } from "@/hooks/useDoctorDashboardStats";
import { useRefreshManager } from "@/hooks/useRefreshManager";

// Doctor-specific dashboard components
import { QuickStatsCards } from "./doctor/QuickStatsCards";
import { DateAppointments } from "./doctor/DateAppointments";
import { TodaysSchedule } from "./doctor/TodaysSchedule";
import { OrderedLabTestResults } from "./doctor/OrderedLabTestResults";
import { CompletedAppointmentsBills } from "./doctor/CompletedAppointmentsBills";
import { StandaloneBillingCard } from "./doctor/StandaloneBillingCard";
import { DirectLabTestOrdering } from "./doctor/DirectLabTestOrdering";

// Shared components
import { TriageQueue } from "./nurse/TriageQueue";
import { DashboardToggle } from "../DashboardToggle";
import { PatientTimelineView } from "../PatientTimelineView";
import { DashboardHeader } from "../shared/DashboardHeader";
import { InpatientManagement } from "@/components/inpatient/InpatientManagement";


/**
 * Doctor Dashboard Implementation
 * 
 * Manages the doctor's workspace with two main views:
 * 1. Dashboard view - Shows all relevant cards and statistics
 * 2. Timeline view - Patient-centric chronological view of care
 */
const DoctorDashboard = () => {
  const { profile } = useAuth();
  const stats = useDoctorDashboardStats();
  const [viewMode, setViewMode] = useState<'outpatients' | 'inpatients' | 'timeline'>('outpatients');
  const { registerRefresh, triggerRefresh } = useRefreshManager();

  /**
   * Handles vitals recording completion
   * Refreshes the triage queue after a 2-second delay to allow database updates to propagate
   */
  const handleVitalsRecorded = () => {
    setTimeout(() => {
      triggerRefresh('triageQueue');
    }, 2000);
  };

  if (viewMode === 'timeline') {
    return <PatientTimelineView onNavigate={setViewMode} />;
  }

  if (viewMode === 'inpatients') {
    return <InpatientManagement />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader
        title="Doctor Dashboard"
        subtitle={`Welcome back, Dr. ${profile?.username}`}
      />

      {/* Dashboard Toggle */}
        <DashboardToggle 
          viewMode={viewMode} 
          onToggle={(mode: 'outpatients' | 'inpatients' | 'timeline') => setViewMode(mode)} 
        />

      {/* Quick Stats */}
      <QuickStatsCards stats={stats} />

      {/* Appointments by Date - Full Width */}
      <DateAppointments 
        refreshTrigger={(fn) => registerRefresh('dateAppointments', fn)}
      />

      {/* Today's Schedule - Full Width */}
      <TodaysSchedule />

      {/* Triage Assessment / Queue */}
      <TriageQueue 
        showRecordVisitButton={true} 
        showVitalSigns={true} 
        refreshTrigger={(fn) => registerRefresh('triageQueue', fn)}
      />

      {/* Direct Lab Test Ordering */}
      <DirectLabTestOrdering />

      {/* Ordered Lab Test Results */}
      <OrderedLabTestResults />

      {/* Standalone Billing Card */}
      <StandaloneBillingCard />

      {/* Completed Appointments and Bills */}
      <CompletedAppointmentsBills />

    </div>
  );
};

export default DoctorDashboard;
