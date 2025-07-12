import { NurseDashboardStats } from "@/hooks/useNurseDashboardStats";

interface NurseStatsCardsProps {
  stats: NurseDashboardStats;
}

export const NurseStatsCards = ({ stats }: NurseStatsCardsProps) => {
  const quickStats = [
    { 
      label: "Total Patients", 
      value: stats.totalPatients.toString(), 
      bgColor: "bg-gradient-to-r from-orange-400 to-orange-500",
      textColor: "text-white"
    },
    { 
      label: "New Patients Today", 
      value: stats.newPatientsToday.toString(), 
      bgColor: "bg-gradient-to-r from-purple-400 to-purple-500",
      textColor: "text-white"
    },
    { 
      label: "Today's Appointments", 
      value: stats.todaysAppointments.toString(), 
      bgColor: "bg-gradient-to-r from-amber-400 to-amber-500",
      textColor: "text-white"
    },
    { 
      label: "Total Pending Bills", 
      value: stats.totalPendingBills.toString(), 
      bgColor: "bg-gradient-to-r from-pink-400 to-pink-500",
      textColor: "text-white"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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