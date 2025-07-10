import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeVariant, getStatusLabel } from "@/lib/financeUtils";

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBill: any;
  paymentAmount: string;
  paymentMethod: string;
  onPaymentAmountChange: (value: string) => void;
  onPaymentMethodChange: (value: string) => void;
  onPayment: () => void;
}

export const PaymentDialog = ({
  isOpen,
  onOpenChange,
  selectedBill,
  paymentAmount,
  paymentMethod,
  onPaymentAmountChange,
  onPaymentMethodChange,
  onPayment
}: PaymentDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for {selectedBill?.patient_name}
          </DialogDescription>
        </DialogHeader>
        
        {selectedBill && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Total Amount:</p>
                <p>₦{selectedBill.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="font-medium">Amount Paid:</p>
                <p>₦{(selectedBill.amount_paid || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="font-medium">Outstanding:</p>
                <p>₦{(selectedBill.amount - (selectedBill.amount_paid || 0)).toLocaleString()}</p>
              </div>
              <div>
                <p className="font-medium">Status:</p>
                <Badge variant={getStatusBadgeVariant(selectedBill.payment_status)}>
                  {getStatusLabel(selectedBill.payment_status)}
                </Badge>
              </div>
            </div>
            
            <div>
              <label htmlFor="payment-amount" className="block text-sm font-medium mb-2">
                Payment Amount (₦)
              </label>
              <Input
                id="payment-amount"
                type="number"
                placeholder="Enter payment amount"
                value={paymentAmount}
                onChange={(e) => onPaymentAmountChange(e.target.value)}
                min="0"
                max={selectedBill.amount - (selectedBill.amount_paid || 0)}
                step="0.01"
              />
            </div>
            
            <div>
              <label htmlFor="payment-method" className="block text-sm font-medium mb-2">
                Payment Method
              </label>
              <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onPayment}>
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};