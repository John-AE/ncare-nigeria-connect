import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
}: BillDetailsDialogProps) => {
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillDetailsDialog;