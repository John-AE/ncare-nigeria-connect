import { LaboratoryDashboardStats } from "@/hooks/useLaboratoryDashboard";

interface LaboratoryStatsCardsProps {
  stats: LaboratoryDashboardStats;
}

export const LaboratoryStatsCards = ({ stats }: LaboratoryStatsCardsProps) => {
  const statCards = [
    { 
      label: "Orders Today", 
      value: stats.totalOrdersToday.toString(), 
      borderColor: "border-l-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-900"
    },
    { 
      label: "Pending Results", 
      value: stats.pendingResults.toString(), 
      borderColor: "border-l-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-900"
    },
    { 
      label: "Completed Today", 
      value: stats.completedTests.toString(), 
      borderColor: "border-l-emerald-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-900"
    },
    { 
      label: "Critical Results", 
      value: stats.criticalResults.toString(), 
      borderColor: "border-l-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-900"
    },
    { 
      label: "Monthly Revenue", 
      value: `$${stats.totalRevenue.toFixed(2)}`, 
      borderColor: "border-l-primary",
      bgColor: "bg-primary/5",
      textColor: "text-primary"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => (
        <div 
          key={index} 
          className={`${stat.borderColor} ${stat.bgColor} ${stat.textColor} border-l-8 rounded-lg px-6 py-4 shadow-sm hover:shadow-md transition-all duration-200`}
        >
          <div className="flex flex-col">
            <p className="text-2xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm font-medium opacity-80">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};