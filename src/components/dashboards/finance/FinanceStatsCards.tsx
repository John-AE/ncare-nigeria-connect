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
    { label: "Today's Revenue", value: `₦${todaysRevenue.toLocaleString()}`, color: "bg-accent", showNaira: true },
    { label: "Pending Bills", value: pendingBillsCount.toString(), color: "bg-primary", showNaira: false },
    { label: "Partial Payments", value: partialPaymentsCount.toString(), color: "bg-rose", showNaira: false },
    { label: "Total Outstanding Amount", value: `₦${outstandingAmount.toLocaleString()}`, color: "bg-destructive", showNaira: true }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {quickStats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className={`h-10 w-10 rounded-full ${stat.color} flex items-center justify-center`}>
                {stat.showNaira ? (
                  <span className="text-lg font-bold text-white">₦</span>
                ) : (
                  <span className="text-lg font-bold text-white">#</span>
                )}
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