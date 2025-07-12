import { Card, CardContent } from "@/components/ui/card";

interface FinanceStatsCardsProps {
  todaysRevenue: number;
  pendingBillsCount: number;
  partialPaymentsCount: number;
  outstandingAmount: number;
}

export const FinanceStatsCards = ({
  todaysRevenue,
  pendingBillsCount,
  partialPaymentsCount,
  outstandingAmount
}: FinanceStatsCardsProps) => {
  const quickStats = [
    { 
      label: "Today's Revenue", 
      value: `₦${todaysRevenue.toLocaleString()}`, 
      bgColor: "bg-gradient-to-r from-violet-400 to-violet-500",
      textColor: "text-white"
    },
    { 
      label: "Pending Bills", 
      value: pendingBillsCount.toString(), 
      bgColor: "bg-gradient-to-r from-cyan-400 to-cyan-500",
      textColor: "text-white"
    },
    { 
      label: "Partial Payments", 
      value: partialPaymentsCount.toString(), 
      bgColor: "bg-gradient-to-r from-teal-400 to-teal-500",
      textColor: "text-white"
    },
    { 
      label: "Total Outstanding Amount", 
      value: `₦${outstandingAmount.toLocaleString()}`, 
      bgColor: "bg-gradient-to-r from-rose-400 to-rose-500",
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