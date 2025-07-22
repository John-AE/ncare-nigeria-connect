import { PharmacyStatsCards } from "./pharmacy/PharmacyStatsCards";
import { CompletedConsultations } from "./nurse/CompletedConsultations";
import { MedicationInventory } from "./pharmacy/MedicationInventory";
import { usePharmacyDashboard } from "@/hooks/usePharmacyDashboard";

export const PharmacyDashboard = () => {
  const { stats, loading, error } = usePharmacyDashboard();

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
      {/* Stats Cards */}
      <PharmacyStatsCards stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Completed Consultations */}
        <div className="space-y-6">
          <CompletedConsultations />
        </div>

        {/* Medication Inventory */}
        <div className="space-y-6">
          <MedicationInventory />
        </div>
      </div>
    </div>
  );
};