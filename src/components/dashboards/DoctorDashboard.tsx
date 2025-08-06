import { useState, useRef } from "react";
import { useAuth } from "../AuthProvider";
import { useDoctorDashboardStats } from "@/hooks/useDoctorDashboardStats";
import { RefreshCw, Stethoscope, Calendar, Users, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickStatsCards } from "./doctor/QuickStatsCards";
import { DateAppointments } from "./doctor/DateAppointments";
import { TodaysSchedule } from "./doctor/TodaysSchedule";
import { TriageQueue } from "./nurse/TriageQueue";
import { CompletedAppointmentsBills } from "./doctor/CompletedAppointmentsBills";
import { StandaloneBillingCard } from "./doctor/StandaloneBillingCard";
import { LabTestOrdering } from "./doctor/LabTestOrdering";
import { DashboardToggle } from "../DashboardToggle";
import { PatientTimelineView } from "../PatientTimelineView";

const DoctorDashboard = () => {
  const { profile } = useAuth();
  const stats = useDoctorDashboardStats();
  const [viewMode, setViewMode] = useState<'dashboard' | 'timeline'>('dashboard');
  
  // Refs to trigger refreshes without re-mounting components
  const triageQueueRefreshRef = useRef<() => void>(null);
  const dateAppointmentsRefreshRef = useRef<() => void>(null);

  const handleRefresh = () => {
    window.location.reload();
  };

  // Handle vitals recording to refresh triage queue after 2 seconds
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

  // Get current time for greeting
  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return "Good morning";
    if (currentHour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header with gradient and animations */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-2xl">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 via-transparent to-transparent"></div>
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
          </div>
          
          <div className="relative flex justify-between items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Stethoscope className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                    Doctor Dashboard
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-blue-100 text-lg">
                      {getGreeting()}, Dr. {profile?.username}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-blue-200/80 text-sm max-w-md">
                Manage your patients, appointments, and clinical workflows efficiently
              </p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats with enhanced animations */}
        <div className="transform hover:scale-[1.01] transition-transform duration-300">
          <QuickStatsCards stats={stats} />
        </div>

        {/* Dashboard Toggle with enhanced styling */}
        <div className="flex justify-center">
          <div className="transform hover:scale-105 transition-all duration-300">
            <DashboardToggle viewMode={viewMode} onToggle={setViewMode} />
          </div>
        </div>

        {/* Main Content Sections with improved spacing and animations */}
        <div className="space-y-8">
          {/* Appointments by Date - Enhanced card */}
          <div className="group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                Appointments Overview
              </h2>
            </div>
            <div className="transform hover:scale-[1.005] transition-all duration-300 hover:shadow-xl">
              <DateAppointments 
                refreshTrigger={dateAppointmentsRefreshRef}
              />
            </div>
          </div>

          {/* Today's Schedule - Enhanced card */}
          <div className="group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors duration-300">
                Today's Schedule
              </h2>
              <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                Live Updates
              </div>
            </div>
            <div className="transform hover:scale-[1.005] transition-all duration-300 hover:shadow-xl">
              <TodaysSchedule />
            </div>
          </div>

          {/* Triage Assessment / Queue - Enhanced card */}
          <div className="group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 group-hover:text-orange-600 transition-colors duration-300">
                Patient Triage Queue
              </h2>
              <div className="ml-auto">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Priority Patients
                </span>
              </div>
            </div>
            <div className="transform hover:scale-[1.005] transition-all duration-300 hover:shadow-xl">
              <TriageQueue 
                showRecordVisitButton={true} 
                showVitalSigns={true} 
                refreshTrigger={triageQueueRefreshRef}
              />
            </div>
          </div>

          {/* Lab Test Ordering - Enhanced card */}
          <div className="group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 group-hover:text-purple-600 transition-colors duration-300">
                Laboratory Test Orders
              </h2>
            </div>
            <div className="transform hover:scale-[1.005] transition-all duration-300 hover:shadow-xl">
              <LabTestOrdering />
            </div>
          </div>

          {/* Billing Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Standalone Billing Card */}
            <div className="group">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                  <RefreshCw className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 group-hover:text-green-600 transition-colors duration-300">
                  Quick Billing
                </h2>
              </div>
              <div className="transform hover:scale-[1.02] transition-all duration-300 hover:shadow-xl">
                <StandaloneBillingCard />
              </div>
            </div>

            {/* Completed Appointments and Bills */}
            <div className="group">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 group-hover:text-cyan-600 transition-colors duration-300">
                  Completed Sessions
                </h2>
              </div>
              <div className="transform hover:scale-[1.02] transition-all duration-300 hover:shadow-xl">
                <CompletedAppointmentsBills />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;