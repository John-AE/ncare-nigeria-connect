import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EnterResultsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onResultSubmitted: () => void;
}

export const EnterResultsDialog = ({
  isOpen,
  onClose,
  order,
  onResultSubmitted,
}: EnterResultsDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    result_value: "",
    reference_range: order?.lab_test_types?.normal_range || "",
    is_abnormal: false,
    is_critical: false,
    comments: "",
  });

  const handleSubmit = async () => {
    if (!formData.result_value.trim()) {
      toast({
        title: "Error",
        description: "Please enter the test result value",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create lab result
      const { error: resultError } = await supabase
        .from("lab_results")
        .insert({
          order_id: order.id,
          result_value: formData.result_value,
          reference_range: formData.reference_range,
          is_abnormal: formData.is_abnormal,
          is_critical: formData.is_critical,
          comments: formData.comments || null,
          result_status: "completed",
          tested_by: profile?.user_id,
          tested_at: new Date().toISOString(),
          reviewed_by: profile?.user_id,
          reviewed_at: new Date().toISOString(),
          hospital_id: profile?.hospital_id,
        });

      if (resultError) throw resultError;

      // Update order status to completed
      const { error: orderError } = await supabase
        .from("lab_orders")
        .update({ status: "completed" })
        .eq("id", order.id);

      if (orderError) throw orderError;

      toast({
        title: "Success",
        description: "Test results entered successfully",
      });

      // Invalidate all related queries to trigger refresh across lab components
      queryClient.invalidateQueries({ queryKey: ["lab-orders-queue"] });
      queryClient.invalidateQueries({ queryKey: ["lab-orders-actionable"] });
      queryClient.invalidateQueries({ queryKey: ["recent-lab-results"] });
      queryClient.invalidateQueries({ queryKey: ["lab-test-billing"] });
      queryClient.invalidateQueries({ queryKey: ["lab-billing-history"] });
      queryClient.invalidateQueries({ queryKey: ["laboratory-dashboard"] });

      onResultSubmitted();
      onClose();
      
      // Reset form
      setFormData({
        result_value: "",
        reference_range: order?.lab_test_types?.normal_range || "",
        is_abnormal: false,
        is_critical: false,
        comments: "",
      });

    } catch (error) {
      console.error("Error entering results:", error);
      toast({
        title: "Error",
        description: "Failed to enter test results",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enter Test Results</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient and Test Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Test Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Patient:</span> {order.patients?.first_name} {order.patients?.last_name}
              </div>
              <div>
                <span className="font-medium">Test:</span> {order.lab_test_types?.name}
              </div>
              <div>
                <span className="font-medium">Code:</span> {order.lab_test_types?.code}
              </div>
              <div>
                <span className="font-medium">Sample Type:</span> {order.lab_test_types?.sample_type}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Normal Range:</span> {order.lab_test_types?.normal_range || "Not specified"}
              </div>
            </div>
          </div>

          {/* Result Entry Form */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Test Result Value *</label>
              <Input
                value={formData.result_value}
                onChange={(e) => setFormData(prev => ({ ...prev, result_value: e.target.value }))}
                placeholder="Enter the test result value"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Reference Range</label>
              <Input
                value={formData.reference_range}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_range: e.target.value }))}
                placeholder="Enter reference range (if different from default)"
              />
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="abnormal"
                  checked={formData.is_abnormal}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_abnormal: !!checked }))}
                />
                <label htmlFor="abnormal" className="text-sm font-medium">
                  Abnormal Result
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="critical"
                  checked={formData.is_critical}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_critical: !!checked }))}
                />
                <label htmlFor="critical" className="text-sm font-medium">
                  Critical Result
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Comments/Notes</label>
              <Textarea
                value={formData.comments}
                onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Enter any additional comments or observations"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Submit Results
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};