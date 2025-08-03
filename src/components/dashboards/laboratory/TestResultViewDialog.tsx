import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import jsPDF from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TestResultViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  result: any;
}

export const TestResultViewDialog = ({
  isOpen,
  onClose,
  result,
}: TestResultViewDialogProps) => {
  const { toast } = useToast();

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

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text("Laboratory Test Result", 20, 30);
      
      // Patient Info
      doc.setFontSize(12);
      doc.text(`Patient: ${result.lab_orders?.patients?.first_name} ${result.lab_orders?.patients?.last_name}`, 20, 50);
      doc.text(`Test: ${result.lab_orders?.lab_test_types?.name}`, 20, 60);
      doc.text(`Test Code: ${result.lab_orders?.lab_test_types?.code}`, 20, 70);
      doc.text(`Sample Type: ${result.lab_orders?.lab_test_types?.sample_type}`, 20, 80);
      
      // Results
      doc.setFontSize(14);
      doc.text("Results", 20, 100);
      doc.setFontSize(12);
      doc.text(`Result Value: ${result.result_value}`, 20, 110);
      if (result.reference_range) {
        doc.text(`Reference Range: ${result.reference_range}`, 20, 120);
      }
      doc.text(`Status: ${getResultStatusText(result.is_abnormal, result.is_critical)}`, 20, 130);
      
      if (result.comments) {
        doc.text("Comments:", 20, 150);
        const splitComments = doc.splitTextToSize(result.comments, 170);
        doc.text(splitComments, 20, 160);
      }
      
      // Footer
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, doc.internal.pageSize.height - 20);
      
      // Save the PDF
      doc.save(`test-result-${result.lab_orders?.patients?.first_name}-${result.lab_orders?.patients?.last_name}-${result.lab_orders?.lab_test_types?.code}.pdf`);
      
      toast({
        title: "Success",
        description: "Test result PDF generated successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  if (!result) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Test Result Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient and Test Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Patient & Test Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Patient:</span> {result.lab_orders?.patients?.first_name} {result.lab_orders?.patients?.last_name}
              </div>
              <div>
                <span className="font-medium">Test:</span> {result.lab_orders?.lab_test_types?.name}
              </div>
              <div>
                <span className="font-medium">Test Code:</span> {result.lab_orders?.lab_test_types?.code}
              </div>
              <div>
                <span className="font-medium">Sample Type:</span> {result.lab_orders?.lab_test_types?.sample_type}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Test Date:</span> {new Date(result.tested_at || result.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Result Status:</h4>
              <Badge className={getResultStatusColor(result.is_abnormal, result.is_critical)}>
                {getResultIcon(result.is_abnormal, result.is_critical)}
                {getResultStatusText(result.is_abnormal, result.is_critical)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Result Value</label>
                <div className="p-3 bg-muted rounded-lg font-mono text-lg">
                  {result.result_value}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Reference Range</label>
                <div className="p-3 bg-muted rounded-lg">
                  {result.reference_range || "Not specified"}
                </div>
              </div>
            </div>

            {result.comments && (
              <div>
                <label className="text-sm font-medium">Comments/Notes</label>
                <div className="p-3 bg-muted rounded-lg">
                  {result.comments}
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Tested By:</span> Lab Technician
              </div>
              <div>
                <span className="font-medium">Completed:</span> {result.reviewed_at 
                  ? formatDistanceToNow(new Date(result.reviewed_at)) + " ago"
                  : "Just completed"
                }
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={generatePDF}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};