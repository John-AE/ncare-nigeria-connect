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

import { useState, useRef } from "react";
import { useAuth } from "../AuthProvider";
import { useDoctorDashboardStats } from "@/hooks/useDoctorDashboardStats";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Doctor-specific dashboard components
import { QuickStatsCards } from "./doctor/QuickStatsCards";
import { DateAppointments } from "./doctor/DateAppointments";
import { TodaysSchedule } from "./doctor/TodaysSchedule";
import { OrderedLabTestResults } from "./doctor/OrderedLabTestResults";
import { CompletedAppointmentsBills } from "./doctor/CompletedAppointmentsBills";
import { StandaloneBillingCard } from "./doctor/StandaloneBillingCard";

// Shared components
import { TriageQueue } from "./nurse/TriageQueue";
import { DashboardToggle } from "../DashboardToggle";
import { PatientTimelineView } from "../PatientTimelineView";


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
  const [viewMode, setViewMode] = useState<'dashboard' | 'timeline'>('dashboard');
  
  // Refs to trigger refreshes without re-mounting components - improves performance
  const triageQueueRefreshRef = useRef<() => void>(null);
  const dateAppointmentsRefreshRef = useRef<() => void>(null);

  /**
   * Handles manual dashboard refresh
   * Force reloads the entire page to ensure all data is fresh
   */
  const handleRefresh = () => {
    window.location.reload();
  };

  /**
   * Handles vitals recording completion
   * Refreshes the triage queue after a 2-second delay to allow database updates to propagate
   */
  const handleVitalsRecorded = () => {
    setTimeout(() => {
      if (triageQueueRefreshRef.current) {
        triageQueueRefreshRef.current();
      }
    }, 2000);
  };

  if (viewMode === 'timeline') {
    return <PatientTimelineView onBack={() => setViewMode('dashboard')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Doctor Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, Dr. {profile?.username}</p>
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
      <QuickStatsCards stats={stats} />

      {/* Dashboard Toggle */}
      <DashboardToggle viewMode={viewMode} onToggle={setViewMode} />

      {/* Appointments by Date - Full Width */}
      <DateAppointments 
        refreshTrigger={dateAppointmentsRefreshRef}
      />

      {/* Today's Schedule - Full Width */}
      <TodaysSchedule />

      {/* Triage Assessment / Queue */}
      <TriageQueue 
        showRecordVisitButton={true} 
        showVitalSigns={true} 
        refreshTrigger={triageQueueRefreshRef}
      />

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
