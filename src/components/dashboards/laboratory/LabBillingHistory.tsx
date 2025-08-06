import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, Loader2, Search } from "lucide-react";

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
  const pageSize = 5; // Show first 5, then load more on scroll

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const queryKey = useMemo(() => ["lab-billing-history", debounced, pageSize], [debounced]);

  const fetchPage = async ({ pageParam = 0 }): Promise<{ rows: HistoryRow[]; nextOffset: number | null }> => {
    let query = supabase
      .from("lab_orders")
      .select(
        `*,
         patients ( first_name, last_name ),
         lab_test_types ( name, code, price ),
         bills!bills_lab_order_id_fkey ( amount, amount_paid ),
         lab_results ( result_status, reviewed_at )
        `
      )
      .order("order_date", { ascending: false })
      .range(pageParam, pageParam + pageSize - 1);

    if (debounced) {
      query = query.or(
        `patients.first_name.ilike.%${debounced}%,patients.last_name.ilike.%${debounced}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data as HistoryRow[]).filter((o) =>
      (o.lab_results || []).some((r) => r.result_status === "completed")
    );

    // If fewer than pageSize returned, no more pages
    const nextOffset = rows.length < pageSize ? null : pageParam + pageSize;
    return { rows, nextOffset };
  };

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey,
    queryFn: fetchPage,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    refetchInterval: 30000,
  });

  // Intersection Observer for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: node.parentElement, rootMargin: "0px", threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, data]);

  const rows = useMemo(() => (data?.pages || []).flatMap((p) => p.rows), [data]);

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
                  setSearch(e.target.value);
                }}
                className="pl-8"
              />
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
        ) : rows.length > 0 ? (
          <div className="space-y-3 max-h-[28rem] overflow-auto pr-1">
            {rows.map((row) => {
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
            {/* Sentinel for infinite scrolling */}
            <div ref={sentinelRef} />
            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">Loading more...</span>
              </div>
            )}
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
