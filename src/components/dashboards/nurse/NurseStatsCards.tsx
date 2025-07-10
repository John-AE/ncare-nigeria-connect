import { Card, CardContent } from "@/components/ui/card";
import { NurseDashboardStats } from "@/hooks/useNurseDashboardStats";

interface NurseStatsCardsProps {
  stats: NurseDashboardStats;
}

export const NurseStatsCards = ({ stats }: NurseStatsCardsProps) => {
  const quickStats = [
    { label: "Total Patients", value: stats.totalPatients.toString(), color: "bg-primary" },
    { label: "New Patients Today", value: stats.newPatientsToday.toString(), color: "bg-accent" },
    { label: "Today's Appointments", value: stats.todaysAppointments.toString(), color: "bg-amber" },
    { label: "Total Pending Bills", value: stats.totalPendingBills.toString(), color: "bg-destructive" }
  ];

  return (
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
  );
};