import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { Scissors } from 'lucide-react';

interface ProcedureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admissionId: string;
  patientId: string;
  onSuccess?: () => void;
}

export const ProcedureDialog = ({ open, onOpenChange, admissionId, patientId, onSuccess }: ProcedureDialogProps) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    procedureType: '',
    startTime: '',
    endTime: '',
    staffInvolved: '',
    outcomes: '',
    complications: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startDateTime = new Date(formData.startTime);
      const endDateTime = formData.endTime ? new Date(formData.endTime) : null;

      const { error } = await supabase.from('inpatient_procedures').insert({
        admission_id: admissionId,
        patient_id: patientId,
        hospital_id: profile?.hospital_id,
        procedure_name: formData.procedureType,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime ? endDateTime.toISOString() : null,
        performed_by: profile?.user_id,
        assistants: formData.staffInvolved ? formData.staffInvolved.split(',').map(s => s.trim()) : [],
        outcome: formData.outcomes || null,
        notes: formData.complications || null
      });

      if (error) throw error;

      toast({ title: "Success", description: "Procedure recorded successfully" });
      setFormData({ procedureType: '', startTime: '', endTime: '', staffInvolved: '', outcomes: '', complications: '' });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error recording procedure:', error);
      toast({ title: "Error", description: "Failed to record procedure", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-red-500" />
            Record Procedure
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Procedure Type</Label>
            <Input
              value={formData.procedureType}
              onChange={(e) => setFormData(prev => ({ ...prev, procedureType: e.target.value }))}
              placeholder="e.g., Blood draw, Catheter insertion"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Time</Label>
              <Input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>End Time</Label>
              <Input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Staff Involved</Label>
            <Input
              value={formData.staffInvolved}
              onChange={(e) => setFormData(prev => ({ ...prev, staffInvolved: e.target.value }))}
              placeholder="Names of staff members involved"
            />
          </div>

          <div>
            <Label>Outcomes</Label>
            <Textarea
              value={formData.outcomes}
              onChange={(e) => setFormData(prev => ({ ...prev, outcomes: e.target.value }))}
              placeholder="Procedure results and outcomes"
              rows={3}
            />
          </div>

          <div>
            <Label>Complications (if any)</Label>
            <Textarea
              value={formData.complications}
              onChange={(e) => setFormData(prev => ({ ...prev, complications: e.target.value }))}
              placeholder="Any complications or adverse events"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-red-500 hover:bg-red-600">
              Record Procedure
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};