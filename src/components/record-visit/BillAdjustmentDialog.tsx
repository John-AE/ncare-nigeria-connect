import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Edit, Ban } from "lucide-react";

interface BillAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billId: string;
  originalAmount: number;
  isPaid: boolean;
  onAdjustmentComplete: () => void;
}

export const BillAdjustmentDialog = ({
  open,
  onOpenChange,
  billId,
  originalAmount,
  isPaid,
  onAdjustmentComplete
}: BillAdjustmentDialogProps) => {
  const [adjustmentType, setAdjustmentType] = useState<'adjust' | 'void'>('adjust');
  const [newAmount, setNewAmount] = useState(originalAmount);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the adjustment",
        variant: "destructive"
      });
      return;
    }

    if (adjustmentType === 'adjust' && newAmount < 0) {
      toast({
        title: "Error",
        description: "New amount cannot be negative",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const finalAmount = adjustmentType === 'void' ? 0 : newAmount;

      // Record the adjustment
      const { error: adjustmentError } = await supabase
        .from('bill_adjustments')
        .insert({
          bill_id: billId,
          original_amount: originalAmount,
          new_amount: finalAmount,
          adjustment_reason: reason,
          adjustment_type: adjustmentType,
          adjusted_by: profile?.user_id,
          hospital_id: profile?.hospital_id
        });

      if (adjustmentError) throw adjustmentError;

      // Update the bill
      const { error: billError } = await supabase
        .from('bills')
        .update({
          amount: finalAmount,
          is_paid: adjustmentType === 'void' ? true : isPaid // Void bills are considered "paid" (resolved)
        })
        .eq('id', billId);

      if (billError) throw billError;

      toast({
        title: "Success",
        description: `Bill ${adjustmentType === 'void' ? 'voided' : 'adjusted'} successfully`,
      });

      onAdjustmentComplete();
      onOpenChange(false);
      setReason('');
      setNewAmount(originalAmount);
    } catch (error) {
      console.error('Error adjusting bill:', error);
      toast({
        title: "Error",
        description: "Failed to adjust bill",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Bill Adjustment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original Amount */}
          <div>
            <Label>Original Amount</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input value={`₦${originalAmount.toLocaleString()}`} disabled />
              <Badge variant={isPaid ? "default" : "secondary"}>
                {isPaid ? "Paid" : "Pending"}
              </Badge>
            </div>
          </div>

          {/* Adjustment Type */}
          <div>
            <Label>Adjustment Type</Label>
            <Select value={adjustmentType} onValueChange={(value: 'adjust' | 'void') => setAdjustmentType(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adjust">
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Adjust Amount
                  </div>
                </SelectItem>
                <SelectItem value="void">
                  <div className="flex items-center gap-2">
                    <Ban className="h-4 w-4" />
                    Void Bill
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* New Amount (only for adjustments) */}
          {adjustmentType === 'adjust' && (
            <div>
              <Label>New Amount</Label>
              <Input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(Number(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="mt-1"
              />
            </div>
          )}

          {/* Reason */}
          <div>
            <Label>Reason for {adjustmentType === 'void' ? 'Voiding' : 'Adjustment'}</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Explain why this bill needs to be ${adjustmentType === 'void' ? 'voided' : 'adjusted'}...`}
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Warning for void */}
          {adjustmentType === 'void' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                ⚠️ <strong>Warning:</strong> Voiding this bill will set the amount to ₦0 and mark it as resolved. 
                This action maintains an audit trail but effectively cancels the bill.
              </p>
            </div>
          )}

          {/* Payment Status Warning */}
          {isPaid && adjustmentType === 'adjust' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                ℹ️ <strong>Note:</strong> This bill has already been paid. Adjusting the amount may require 
                additional payment processing depending on whether the new amount is higher or lower.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !reason.trim()}
              variant={adjustmentType === 'void' ? "destructive" : "default"}
            >
              {loading ? 'Processing...' : adjustmentType === 'void' ? 'Void Bill' : 'Adjust Bill'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};