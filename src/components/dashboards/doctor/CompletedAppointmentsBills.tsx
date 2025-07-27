
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Receipt, FileText, Eye } from "lucide-react";
import { format } from "date-fns";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BillItem {
  id: string;
  services?: {
    name: string;
    price: number;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Bill {
  id: string;
  patient_id: string;
  amount: number;
  discount_amount: number;
  discount_reason: string;
  description: string;
  created_at: string;
  patients: {
    first_name: string;
    last_name: string;
  };
  bill_items: BillItem[];
}

export const CompletedAppointmentsBills = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchBills();
  }, [profile]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('bills')
        .select(`
          id,
          patient_id,
          amount,
          discount_amount,
          discount_reason,
          description,
          created_at,
          patients (
            first_name,
            last_name
          ),
          bill_items (
            id,
            services (
              name,
              price
            ),
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('hospital_id', profile?.hospital_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bills:', error);
        throw error;
      }

      setBills(data || []);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast({
        title: "Error",
        description: "Failed to load bills. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateBillPDF = (bill: Bill) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Medical Bill', 20, 30);
    
    // Patient and bill info
    doc.setFontSize(12);
    doc.text(`Patient: ${bill.patients.first_name} ${bill.patients.last_name}`, 20, 50);
    doc.text(`Bill ID: ${bill.id}`, 20, 60);
    doc.text(`Date: ${format(new Date(bill.created_at), 'PPP')}`, 20, 70);
    doc.text(`Description: ${bill.description}`, 20, 80);
    
    // Bill items table
    const tableData = bill.bill_items.map(item => [
      item.services?.name || 'N/A',
      item.quantity.toString(),
      `₦${item.unit_price.toLocaleString()}`,
      `₦${item.total_price.toLocaleString()}`
    ]);

    autoTable(doc, {
      head: [['Service', 'Quantity', 'Unit Price', 'Total']],
      body: tableData,
      startY: 90,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY || 90;
    
    if (bill.discount_amount > 0) {
      doc.text(`Subtotal: ₦${(bill.amount + bill.discount_amount).toLocaleString()}`, 20, finalY + 15);
      doc.text(`Discount: -₦${bill.discount_amount.toLocaleString()}`, 20, finalY + 25);
      if (bill.discount_reason) {
        doc.text(`Discount Reason: ${bill.discount_reason}`, 20, finalY + 35);
      }
    }
    
    doc.setFontSize(14);
    doc.text(`Total: ₦${bill.amount.toLocaleString()}`, 20, finalY + (bill.discount_amount > 0 ? 50 : 20));

    // Save PDF
    doc.save(`bill-${bill.id}.pdf`);
  };

  const BillDetailsDialog = ({ bill }: { bill: Bill }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bill Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p><strong>Patient:</strong> {bill.patients.first_name} {bill.patients.last_name}</p>
            <p><strong>Bill ID:</strong> {bill.id}</p>
            <p><strong>Date:</strong> {format(new Date(bill.created_at), 'PPP')}</p>
            <p><strong>Description:</strong> {bill.description}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Bill Items</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.bill_items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.services?.name || 'N/A'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>₦{item.unit_price.toLocaleString()}</TableCell>
                    <TableCell>₦{item.total_price.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="border-t pt-4">
            {bill.discount_amount > 0 && (
              <>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₦{(bill.amount + bill.discount_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-₦{bill.discount_amount.toLocaleString()}</span>
                </div>
                {bill.discount_reason && (
                  <div className="flex justify-between">
                    <span>Discount Reason:</span>
                    <span>{bill.discount_reason}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total:</span>
              <span>₦{bill.amount.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => generateBillPDF(bill)}>
              <FileText className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Completed Appointments & Bills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading bills...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Completed Appointments & Bills
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bills.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No completed appointments with bills found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map(bill => (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">
                    {bill.patients.first_name} {bill.patients.last_name}
                  </TableCell>
                  <TableCell>{bill.description}</TableCell>
                  <TableCell>{format(new Date(bill.created_at), 'PPP')}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      ₦{bill.amount.toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <BillDetailsDialog bill={bill} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateBillPDF(bill)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
