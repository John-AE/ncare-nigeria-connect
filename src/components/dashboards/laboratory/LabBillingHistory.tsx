import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface HistoryRow {
  id: string;
  order_date: string;
  status: string;
  patients: { first_name: string; last_name: string } | null;
  lab_test_types: { name: string; code: string; price: number } | null;
  bills: { amount: number; amount_paid: number }[] | null;
  lab_results: { result_status: string; reviewed_at: string | null }[] | null;
}

export const LabBillingHistory = () => {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["lab-billing-history", debounced, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from("lab_orders")
        .select(
          `*,
           patients ( first_name, last_name ),
           lab_test_types ( name, code, price ),
           bills!bills_lab_order_id_fkey ( amount, amount_paid ),
           lab_results ( result_status, reviewed_at )
          `,
          { count: "exact" }
        )
        .order("order_date", { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);

      if (debounced) {
        query = query.or(
          `patients.first_name.ilike.%${debounced}%,patients.last_name.ilike.%${debounced}%`
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;

      // Keep only orders that have a completed result
      const rows = (data as HistoryRow[]).filter((o) =>
        (o.lab_results || []).some((r) => r.result_status === "completed")
      );

      return { rows, total: count ?? rows.length };
    },
    refetchInterval: 30000,
  });

  const totalPages = useMemo(() => {
    const total = data?.total ?? 0;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [data?.total]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lab Billing History
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
            <span>Loading history...</span>
          </div>
        ) : data && data.rows.length > 0 ? (
          <div className="space-y-3">
            {data.rows.map((row) => {
              const bill = row.bills?.[0];
              const paid = bill && bill.amount_paid >= bill.amount;
              return (
                <div key={row.id} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm">{row.lab_test_types?.name}</span>
                        {row.lab_test_types?.code && (
                          <Badge variant="outline" className="text-xs">{row.lab_test_types.code}</Badge>
                        )}
                        {paid ? (
                          <Badge className="bg-green-100 text-green-800">Paid</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Partially/Unpaid</Badge>
                        )}
                        <Badge className="bg-green-100 text-green-800">Completed</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Patient: {row.patients ? `${row.patients.first_name} ${row.patients.last_name}` : "-"} • Date: {new Date(row.order_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right min-w-[96px]">
                      <span className="font-semibold">₦{(row.lab_test_types?.price ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No completed lab bills found for the current filter.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
