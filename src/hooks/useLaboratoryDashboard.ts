import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LaboratoryDashboardStats {
  totalOrdersToday: number;
  pendingResults: number;
  completedTests: number;
  criticalResults: number;
  totalRevenue: number;
  mostOrderedTests: Array<{
    name: string;
    count: number;
  }>;
  dailyOrders: Array<{
    date: string;
    orders: number;
  }>;
}

export const useLaboratoryDashboard = () => {
  return useQuery({
    queryKey: ["laboratory-dashboard"],
    queryFn: async (): Promise<LaboratoryDashboardStats> => {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get orders for today
      const { data: todayOrders } = await supabase
        .from("lab_orders")
        .select("*")
        .gte("order_date", today)
        .lt("order_date", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      // Get pending results
      const { data: pendingResults } = await supabase
        .from("lab_results")
        .select("*")
        .eq("result_status", "pending");

      // Get completed tests today
      const { data: completedTests } = await supabase
        .from("lab_results")
        .select("*")
        .eq("result_status", "completed")
        .gte("created_at", today);

      // Get critical results
      const { data: criticalResults } = await supabase
        .from("lab_results")
        .select("*")
        .eq("is_critical", true)
        .eq("result_status", "completed");

      // Get revenue from completed tests
      const { data: revenueData } = await supabase
        .from("lab_orders")
        .select(`
          *,
          lab_test_types(price)
        `)
        .gte("created_at", thirtyDaysAgo)
        .eq("status", "completed");

      // Get most ordered tests
      const { data: testCounts } = await supabase
        .from("lab_orders")
        .select(`
          test_type_id,
          lab_test_types(name)
        `)
        .gte("created_at", thirtyDaysAgo);

      // Get daily orders for chart
      const { data: dailyOrdersData } = await supabase
        .from("lab_orders")
        .select("order_date")
        .gte("order_date", thirtyDaysAgo)
        .order("order_date");

      // Calculate stats
      const totalRevenue = revenueData?.reduce((sum, order) => {
        return sum + (Number(order.lab_test_types?.price) || 0);
      }, 0) || 0;

      // Group test counts
      const testCountMap = new Map();
      testCounts?.forEach(order => {
        const testName = order.lab_test_types?.name;
        if (testName) {
          testCountMap.set(testName, (testCountMap.get(testName) || 0) + 1);
        }
      });

      const mostOrderedTests = Array.from(testCountMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Group daily orders - generate all days in the range
      const dailyOrdersMap = new Map();
      
      // Initialize all days in the last 30 days with 0 orders
      for (let i = 0; i < 30; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        dailyOrdersMap.set(dateStr, 0);
      }
      
      // Count actual orders
      dailyOrdersData?.forEach(order => {
        const date = order.order_date;
        if (dailyOrdersMap.has(date)) {
          dailyOrdersMap.set(date, (dailyOrdersMap.get(date) || 0) + 1);
        }
      });

      const dailyOrders = Array.from(dailyOrdersMap.entries())
        .map(([date, orders]) => ({ 
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
          orders 
        }))
        .reverse() // Show oldest to newest
        .slice(0, 30); // Limit to 30 days

      return {
        totalOrdersToday: todayOrders?.length || 0,
        pendingResults: pendingResults?.length || 0,
        completedTests: completedTests?.length || 0,
        criticalResults: criticalResults?.length || 0,
        totalRevenue,
        mostOrderedTests,
        dailyOrders
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};