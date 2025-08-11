import { PharmacyStatsCards } from "./pharmacy/PharmacyStatsCards";
import { EnhancedCompletedConsultations } from "./pharmacy/EnhancedCompletedConsultations";
import { MedicationInventory } from "./pharmacy/MedicationInventory";
import { DispensedMedicationLog } from "./pharmacy/DispensedMedicationLog";
import { usePharmacyDashboard } from "@/hooks/usePharmacyDashboard";
import { useRefreshManager } from "@/hooks/useRefreshManager";
import { DashboardHeader } from "../shared/DashboardHeader";

export const PharmacyDashboard = () => {
  const { stats, loading, error } = usePharmacyDashboard();
  const { triggerAllRefresh } = useRefreshManager();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Error loading dashboard</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <DashboardHeader
        title="Pharmacy Dashboard"
        subtitle="Manage medications, inventory, and dispensing operations"
        onRefresh={triggerAllRefresh}
      />
      
      {/* Stats Cards */}
      <PharmacyStatsCards stats={stats} />
      
      {/* Main Content - Full Width Cards */}
      <div className="space-y-8">
        {/* Completed Consultations */}
        <EnhancedCompletedConsultations />
        
        {/* Medication Inventory */}
        <MedicationInventory />
        
        {/* Dispensed Medication Log */}
        <DispensedMedicationLog />
      </div>
    </div>
  );
};