import { useLaboratoryDashboard } from "@/hooks/useLaboratoryDashboard";
import { LaboratoryStatsCards } from "./laboratory/LaboratoryStatsCards";
import { TestOrdersQueue } from "./laboratory/TestOrdersQueue";
import { RecentTestResults } from "./laboratory/RecentTestResults";
import { TestTypesManagement } from "./laboratory/TestTypesManagement";
import { TestOrderBilling } from "./laboratory/TestOrderBilling";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Loader2 } from "lucide-react";

export const LaboratoryDashboard = () => {
  const { data: stats, isLoading, error } = useLaboratoryDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading laboratory dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading dashboard data</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <LaboratoryStatsCards stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <TestOrdersQueue />
          <TestOrderBilling />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <TestTypesManagement />
          <RecentTestResults />
        </div>
      </div>

      {/* Charts Section - Moved to bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Test Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Test Orders (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.dailyOrders}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Most Ordered Tests Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Most Ordered Tests (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.mostOrderedTests}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};