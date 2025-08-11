import { useLaboratoryDashboard } from "@/hooks/useLaboratoryDashboard";
import { LaboratoryStatsCards } from "./laboratory/LaboratoryStatsCards";
import { TestOrdersQueue } from "./laboratory/TestOrdersQueue";
import { RecentTestResults } from "./laboratory/RecentTestResults";
import { TestTypesManagement } from "./laboratory/TestTypesManagement";
import { TestOrderBilling } from "./laboratory/TestOrderBilling";
import { LabBillingHistory } from "./laboratory/LabBillingHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Loader2, Activity, TrendingUp } from "lucide-react";
import { useRefreshManager } from "@/hooks/useRefreshManager";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardHeader } from "../shared/DashboardHeader";

export const LaboratoryDashboard = () => {
  const { data: stats, isLoading, error, refetch } = useLaboratoryDashboard();
  const { registerRefresh, triggerAllRefresh } = useRefreshManager();

  const handleRefresh = () => {
    triggerAllRefresh();
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl">
        <div className="flex flex-col items-center space-y-4 p-8">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <div className="absolute inset-0 h-12 w-12 animate-ping bg-blue-400 rounded-full opacity-20"></div>
          </div>
          <div className="text-center">
            <span className="text-lg font-semibold text-gray-800">Loading Laboratory Dashboard</span>
            <p className="text-sm text-gray-600 mt-1">Preparing your data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-red-50 to-pink-100 rounded-xl">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Unable to Load Dashboard</h3>
          <p className="text-red-600 text-sm">Error loading dashboard data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Dashboard Header */}
        <DashboardHeader
          title="Laboratory Dashboard"
          subtitle="Real-time insights and analytics for laboratory operations"
          onRefresh={handleRefresh}
        />

        {/* Stats Cards */}
        <div className="transform hover:scale-[1.01] transition-transform duration-300">
          <LaboratoryStatsCards stats={stats} />
        </div>

        {/* Full Width Components - In the requested order */}
        <div className="space-y-8">
          {/* Test Orders Queue */}
          <div className="w-full transform hover:scale-[1.01] transition-all duration-300 hover:shadow-xl">
            <TestOrdersQueue 
              refreshTrigger={(fn) => registerRefresh('lab-orders-queue', fn)}
            />
          </div>

          {/* Test Order Billing */}
          <div className="w-full transform hover:scale-[1.01] transition-all duration-300 hover:shadow-xl">
            <TestOrderBilling 
              refreshTrigger={(fn) => registerRefresh('lab-orders-billing', fn)}
            />
          </div>

          {/* Recent Test Results */}
          <div className="w-full transform hover:scale-[1.01] transition-all duration-300 hover:shadow-xl">
            <RecentTestResults 
              refreshTrigger={(fn) => registerRefresh('recent-lab-results', fn)}
            />
          </div>

          {/* Test Types Management */}
          <div className="w-full transform hover:scale-[1.01] transition-all duration-300 hover:shadow-xl">
            <TestTypesManagement />
          </div>

          {/* Lab Billing History */}
          <div className="w-full transform hover:scale-[1.01] transition-all duration-300 hover:shadow-xl">
            <LabBillingHistory />
          </div>
        </div>

        {/* Charts Section - Enhanced with modern styling (unchanged) */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Analytics & Insights
            </h2>
            <p className="text-gray-600 mt-2">Performance metrics and trending data</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Daily Test Orders Chart */}
            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:bg-white/90">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300 flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  Daily Test Orders
                  <span className="text-sm font-normal text-gray-500 ml-auto">(Last 30 Days)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="relative overflow-hidden rounded-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-30"></div>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={stats.dailyOrders}>
                      <defs>
                        <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6B7280"
                        fontSize={12}
                        tick={{ fill: '#6B7280' }}
                      />
                      <YAxis 
                        stroke="#6B7280"
                        fontSize={12}
                        tick={{ fill: '#6B7280' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="orders" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#fff' }}
                        fill="url(#orderGradient)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Most Ordered Tests Chart */}
            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:bg-white/90">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-emerald-600 transition-colors duration-300 flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                  Most Ordered Tests
                  <span className="text-sm font-normal text-gray-500 ml-auto">(Last 30 Days)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="relative overflow-hidden rounded-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 opacity-30"></div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={stats.mostOrderedTests}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#059669" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#6B7280"
                        fontSize={12}
                        tick={{ fill: '#6B7280' }}
                      />
                      <YAxis 
                        stroke="#6B7280"
                        fontSize={12}
                        tick={{ fill: '#6B7280' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="url(#barGradient)"
                        radius={[4, 4, 0, 0]}
                        className="hover:opacity-80 transition-opacity duration-200"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};