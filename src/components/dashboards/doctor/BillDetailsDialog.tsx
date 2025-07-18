import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface BillItem {
  id: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface BillDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  appointmentTime: string;
  billItems: BillItem[];
  totalAmount: number;
  isPaid: boolean;
  paymentMethod?: string;
  billId?: string;
  patientEmail?: string;
}

const BillDetailsDialog = ({
  open,
  onOpenChange,
  patientName,
  appointmentTime,
  billItems,
  totalAmount,
  isPaid,
  paymentMethod,
  billId,
  patientEmail,
}: BillDetailsDialogProps) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { toast } = useToast();

  const generatePDF = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text("Medical Bill", 20, 30);
      
      // Patient Info
      doc.setFontSize(12);
      doc.text(`Patient: ${patientName}`, 20, 50);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);
      doc.text(`Time: ${appointmentTime}`, 20, 70);
      
      // Bill Items Table
      const tableData = billItems.map(item => [
        item.service_name,
        item.quantity.toString(),
        `₦${item.unit_price.toLocaleString()}`,
        `₦${item.total_price.toLocaleString()}`
      ]);
      
      autoTable(doc, {
        head: [['Service', 'Quantity', 'Unit Price', 'Total']],
        body: tableData,
        startY: 90,
        theme: 'striped',
        headStyles: { fillColor: [0, 100, 200] },
      });
      
      // Total
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(14);
      doc.text(`Total Amount: ₦${totalAmount.toLocaleString()}`, 20, finalY);
      doc.text(`Status: ${isPaid ? 'Paid' : 'Pending'}`, 20, finalY + 10);
      
      if (paymentMethod) {
        doc.text(`Payment Method: ${paymentMethod}`, 20, finalY + 20);
      }
      
      // Save PDF
      doc.save(`bill-${patientName.replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "Bill PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const sendEmailWithBill = async () => {
    if (!patientEmail) {
      toast({
        title: "No Email Address",
        description: "Patient email address is not available.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      // Here you would typically call an edge function to send email
      // For now, we'll show a toast indicating the feature needs backend setup
      toast({
        title: "Email Feature",
        description: "Email functionality requires backend setup. Contact your administrator.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bill Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Patient</p>
              <p className="font-medium">{patientName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Appointment Time</p>
              <p className="font-medium">{appointmentTime}</p>
            </div>
          </div>

          {/* Bill Items */}
          <div>
            <h4 className="font-semibold mb-3">Bill Items</h4>
            <div className="space-y-2">
              {billItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.service_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} × ₦{item.unit_price.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₦{item.total_price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total and Payment Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-lg font-bold">₦{totalAmount.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment Status:</span>
              <Badge variant={isPaid ? "default" : "secondary"}>
                {isPaid ? "Paid" : "Pending"}
              </Badge>
            </div>
            
            {isPaid && paymentMethod && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment Method:</span>
                <span className="text-sm">{paymentMethod}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={generatePDF}
              disabled={isGeneratingPdf}
              className="flex-1"
              variant="outline"
            >
              {isGeneratingPdf ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Generate PDF
            </Button>
            
            <Button 
              onClick={sendEmailWithBill}
              disabled={isSendingEmail || !patientEmail}
              className="flex-1"
              variant="outline"
            >
              {isSendingEmail ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Email Bill
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillDetailsDialog;