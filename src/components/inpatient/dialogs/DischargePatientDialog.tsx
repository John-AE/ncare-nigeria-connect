/**
 * Discharge Patient Dialog
 * 
 * Simple dialog for discharging inpatient with manual billing confirmation.
 * Captures discharge date, summary, diagnosis and billing acknowledgment.
 * 
 * @author NCare Nigeria Development Team
 */

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface DischargePatientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  admissionId: string;
  patientName: string;
  onPatientDischarged?: () => void;
}

export const DischargePatientDialog = ({
  isOpen,
  onOpenChange,
  admissionId,
  patientName,
  onPatientDischarged
}: DischargePatientDialogProps) => {
  const { profile } = useAuth();
  const [dischargeDate, setDischargeDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [dischargeDiagnosis, setDischargeDiagnosis] = useState('');
  const [billingAcknowledged, setBillingAcknowledged] = useState(false);
  const [isDischarging, setIsDischarging] = useState(false);

  const handleDischarge = async () => {
    if (!profile?.user_id || !billingAcknowledged) return;

    setIsDischarging(true);
    try {
      const { error } = await supabase
        .from('inpatient_admissions')
        .update({
          status: 'discharged',
          discharge_date: new Date(dischargeDate).toISOString(),
          discharge_summary: dischargeSummary,
          discharge_diagnosis: dischargeDiagnosis,
          billing_acknowledged: true
        })
        .eq('id', admissionId);

      if (error) {
        console.error('Error discharging patient:', error);
        throw error;
      }

      toast.success(`${patientName} has been successfully discharged`);
      onPatientDischarged?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error discharging patient:', error);
      toast.error('Failed to discharge patient');
    } finally {
      setIsDischarging(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Discharge Patient: {patientName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="discharge-date">Discharge Date</Label>
            <Input
              id="discharge-date"
              type="date"
              value={dischargeDate}
              onChange={(e) => setDischargeDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="discharge-diagnosis">Final Diagnosis</Label>
            <Textarea
              id="discharge-diagnosis"
              placeholder="Enter final diagnosis..."
              value={dischargeDiagnosis}
              onChange={(e) => setDischargeDiagnosis(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="discharge-summary">Discharge Summary</Label>
            <Textarea
              id="discharge-summary"
              placeholder="Enter discharge summary..."
              value={dischargeSummary}
              onChange={(e) => setDischargeSummary(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
            <Checkbox
              id="billing-acknowledged"
              checked={billingAcknowledged}
              onCheckedChange={(checked) => setBillingAcknowledged(checked as boolean)}
            />
            <Label htmlFor="billing-acknowledged" className="text-sm">
              I confirm that all associated medical bills have been reviewed and addressed
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDischarging}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDischarge}
              disabled={!billingAcknowledged || isDischarging}
            >
              {isDischarging ? 'Discharging...' : 'Discharge Patient'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};