import { Card, CardContent } from "@/components/ui/card";
import { DashboardStats } from "@/hooks/useDoctorDashboardStats";

interface QuickStatsCardsProps {
  stats: DashboardStats;
}

export const QuickStatsCards = ({ stats }: QuickStatsCardsProps) => {
  const quickStats = [
    { 
      label: "Total Appointments Today", 
      value: stats.totalAppointmentsToday.toString(), 
      bgColor: "bg-gradient-to-r from-blue-400 to-blue-500",
      textColor: "text-white"
    },
    { 
      label: "Scheduled", 
      value: stats.scheduledAppointments.toString(), 
      bgColor: "bg-gradient-to-r from-yellow-400 to-yellow-500",
      textColor: "text-white"
    },
    { 
      label: "Arrived", 
      value: stats.arrivedPatients.toString(), 
      bgColor: "bg-gradient-to-r from-orange-400 to-orange-500",
      textColor: "text-white"
    },
    { 
      label: "Completed", 
      value: stats.completedAppointments.toString(), 
      bgColor: "bg-gradient-to-r from-green-400 to-green-500",
      textColor: "text-white"
    },
    { 
      label: "Total Patients", 
      value: stats.totalPatients.toString(), 
      bgColor: "bg-gradient-to-r from-purple-400 to-purple-500",
      textColor: "text-white"
    },
    { 
      label: "Pending Bills", 
      value: stats.pendingBills.toString(), 
      bgColor: "bg-gradient-to-r from-red-400 to-red-500",
      textColor: "text-white"
    },
    { 
      label: "Total Revenue", 
      value: `₦${stats.totalRevenue.toFixed(2)}`, 
      bgColor: "bg-gradient-to-r from-emerald-400 to-emerald-500",
      textColor: "text-white"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {quickStats.map((stat, index) => (
        <div 
          key={index} 
          className={`${stat.bgColor} ${stat.textColor} rounded-full px-6 py-4 shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl`}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-2xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm font-medium opacity-90">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};