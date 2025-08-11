import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Receipt, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useUnifiedRefresh } from "@/hooks/useUnifiedRefresh";

interface OrderRow {
  id: string;
  order_date: string;
  status: string;
  priority: string;
  clinical_notes?: string;
  patients: { first_name: string; last_name: string; phone?: string } | null;
  lab_test_types: { name: string; code: string; price: number; category: string; sample_type: string } | null;
  bills: { id: string; amount: number; amount_paid: number }[] | null;
  lab_results: { result_status: string }[] | null;
}

interface TestOrderBillingProps {
  refreshTrigger?: (fn: () => void) => void;
}

export const TestOrderBilling = ({ refreshTrigger }: TestOrderBillingProps) => {
  // Search + pagination for ACTIONABLE bills (orders without completed results)
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["lab-orders-actionable", debounced, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from("lab_orders")
        .select(
          `*,
           patients ( first_name, last_name, phone ),
           lab_test_types ( name, code, price, category, sample_type ),
           bills!bills_lab_order_id_fkey ( id, amount, amount_paid ),
           lab_results ( result_status )
          `,
          { count: "exact" }
        )
        .in("status", ["ordered", "sample_collected", "in_progress"]) // exclude completed from actionable list
        .order("order_date", { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);

      if (debounced) {
        // filter by patient name
        query = query.or(
          `patients.first_name.ilike.%${debounced}%,patients.last_name.ilike.%${debounced}%`
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;

      // Filter out orders that already have a completed result
      const actionable = (data as OrderRow[]).filter(
        (o) => !(o.lab_results || []).some((r) => r.result_status === "completed")
      );

      return { rows: actionable, total: count ?? actionable.length };
    },
    refetchInterval: 30000,
  });

  // Use unified refresh hook
  useUnifiedRefresh(refreshTrigger, refetch);

  const totalPages = useMemo(() => {
    const total = data?.total ?? 0;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [data?.total]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "stat":
        return "bg-red-100 text-red-800";
      case "urgent":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ordered":
        return "bg-blue-100 text-blue-800";
      case "sample_collected":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const paymentBadge = (row: OrderRow) => {
    const bill = row.bills?.[0];
    if (!bill) return { text: "No Bill", cls: "bg-red-100 text-red-800" };
    if (bill.amount_paid >= bill.amount) return { text: "Paid", cls: "bg-green-100 text-green-800" };
    if (bill.amount_paid > 0) return { text: "Partial", cls: "bg-yellow-100 text-yellow-800" };
    return { text: "Unpaid", cls: "bg-red-100 text-red-800" };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Test Order Billing
          </span>
          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patient..."
                value={search}
                onChange={(e) => {
                  setPage(0);
                  setSearch(e.target.value);
                }}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page + 1 >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading billing data...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {data && data.rows.length > 0 ? (
              data.rows.map((row) => {
                const pay = paymentBadge(row);
                return (
                  <div key={row.id} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm">
                            {row.lab_test_types?.name}
                          </span>
                          {row.lab_test_types?.code && (
                            <Badge variant="outline" className="text-xs">{row.lab_test_types.code}</Badge>
                          )}
                          <Badge className={getPriorityColor(row.priority)}>{row.priority}</Badge>
                          <Badge className={getStatusColor(row.status)}>{row.status.replace("_", " ")}</Badge>
                          <Badge className={pay.cls}>{pay.text}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Patient: {row.patients ? `${row.patients.first_name} ${row.patients.last_name}` : "-"} •
                          Sample: {row.lab_test_types?.sample_type ?? "-"} •
                          Date: {new Date(row.order_date).toLocaleDateString()}
                        </div>
                        {row.clinical_notes && (
                          <div className="text-xs text-muted-foreground mt-1">Notes: {row.clinical_notes}</div>
                        )}
                      </div>
                      <div className="text-right min-w-[96px]">
                        <span className="font-semibold">
                          ₦{(row.lab_test_types?.price ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {pay.text === "Paid"
                          ? "Ready to start testing"
                          : pay.text === "Partial"
                          ? "Awaiting full payment"
                          : pay.text === "Unpaid" || pay.text === "No Bill"
                          ? "Payment required before testing"
                          : null}
                      </span>
                      <span>
                        {row.bills?.[0]
                          ? `Paid ₦${(row.bills[0].amount_paid || 0).toLocaleString()} of ₦${(row.bills[0].amount || 0).toLocaleString()}`
                          : "No bill generated"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No actionable lab bills. Paid or completed orders will move to history.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};