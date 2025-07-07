import { useAuth } from "../AuthProvider";
import { useDoctorDashboardStats } from "@/hooks/useDoctorDashboardStats";
import { QuickStatsCards } from "./doctor/QuickStatsCards";
import { DateAppointments } from "./doctor/DateAppointments";
import { TodaysSchedule } from "./doctor/TodaysSchedule";

const DoctorDashboard = () => {
  const { profile } = useAuth();
  const stats = useDoctorDashboardStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold text-foreground">Doctor Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Dr. {profile?.username}</p>
      </div>

      {/* Quick Stats */}
      <QuickStatsCards stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DateAppointments />
        <TodaysSchedule />
      </div>
    </div>
  );
};

export default DoctorDashboard;