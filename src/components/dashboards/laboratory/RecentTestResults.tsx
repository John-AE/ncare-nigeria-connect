import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TestResultViewDialog } from "./TestResultViewDialog";
import { useUnifiedRefresh } from "@/hooks/useUnifiedRefresh";

interface RecentTestResultsProps {
  refreshTrigger?: (fn: () => void) => void;
}

export const RecentTestResults = ({ refreshTrigger }: RecentTestResultsProps) => {
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  const { data: results, isLoading, refetch } = useQuery({
    queryKey: ["recent-lab-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lab_results")
        .select(`
          *,
          lab_orders(
            patients(first_name, last_name),
            lab_test_types(name, code, normal_range)
          )
        `)
        .eq("result_status", "completed")
        .order("reviewed_at", { ascending: false })
        .limit(15);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Use unified refresh hook
  useUnifiedRefresh(refreshTrigger, refetch);

  const getResultStatusColor = (isAbnormal: boolean, isCritical: boolean) => {
    if (isCritical) return "bg-red-100 text-red-800";
    if (isAbnormal) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getResultStatusText = (isAbnormal: boolean, isCritical: boolean) => {
    if (isCritical) return "Critical";
    if (isAbnormal) return "Abnormal";
    return "Normal";
  };

  const getResultIcon = (isAbnormal: boolean, isCritical: boolean) => {
    if (isCritical) return <AlertTriangle className="h-4 w-4" />;
    if (isAbnormal) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle2 className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Recent Test Results ({results?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {results?.map((result) => (
            <div
              key={result.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedResult(result);
                setIsViewDialogOpen(true);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">
                      {result.lab_orders?.patients?.first_name} {result.lab_orders?.patients?.last_name}
                    </h4>
                    <Badge className={getResultStatusColor(result.is_abnormal, result.is_critical)}>
                      {getResultIcon(result.is_abnormal, result.is_critical)}
                      {getResultStatusText(result.is_abnormal, result.is_critical)}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Test:</span>
                      {result.lab_orders?.lab_test_types?.name} ({result.lab_orders?.lab_test_types?.code})
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Result:</span>
                      <span className="font-mono">{result.result_value}</span>
                    </div>
                    {result.reference_range && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Reference:</span>
                        <span className="text-xs">{result.reference_range}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Completed:</span>
                      <span>
                        {result.reviewed_at 
                          ? formatDistanceToNow(new Date(result.reviewed_at)) + " ago"
                          : "Just completed"
                        }
                      </span>
                    </div>
                    {result.comments && (
                      <div className="flex items-start gap-2 mt-2">
                        <span className="font-medium">Notes:</span>
                        <span className="text-xs bg-muted p-2 rounded">{result.comments}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedResult(result);
                      setIsViewDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {result.is_critical && (
                    <Button size="sm" variant="destructive">
                      Alert Doctor
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {!results?.length && (
            <div className="text-center py-8 text-muted-foreground">
              No recent test results
            </div>
          )}
        </div>
      </CardContent>
      
      <TestResultViewDialog
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        result={selectedResult}
      />
    </Card>
  );
};