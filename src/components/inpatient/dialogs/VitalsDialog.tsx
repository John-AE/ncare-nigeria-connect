import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface VitalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admissionId: string;
  patientId: string;
}

export const VitalsDialog = ({ open, onOpenChange, admissionId, patientId }: VitalsDialogProps) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    temperature: '',
    systolic: '',
    diastolic: '',
    heartRate: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    painScale: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('inpatient_vitals').insert({
        admission_id: admissionId,
        patient_id: patientId,
        hospital_id: profile?.hospital_id,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        blood_pressure_systolic: formData.systolic ? parseInt(formData.systolic) : null,
        blood_pressure_diastolic: formData.diastolic ? parseInt(formData.diastolic) : null,
        heart_rate: formData.heartRate ? parseInt(formData.heartRate) : null,
        respiratory_rate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : null,
        oxygen_saturation: formData.oxygenSaturation ? parseFloat(formData.oxygenSaturation) : null,
        pain_scale: formData.painScale ? parseInt(formData.painScale) : null,
        notes: formData.notes || null,
        recorded_by: profile?.user_id
      });

      if (error) throw error;

      toast({ title: "Success", description: "Vital signs recorded successfully" });
      setFormData({ temperature: '', systolic: '', diastolic: '', heartRate: '', respiratoryRate: '', oxygenSaturation: '', painScale: '', notes: '' });
      onOpenChange(false);
    } catch (error) {
      console.error('Error recording vitals:', error);
      toast({ title: "Error", description: "Failed to record vital signs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Vital Signs</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Temperature (°F)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                placeholder="98.6"
              />
            </div>
            <div>
              <Label>Heart Rate (bpm)</Label>
              <Input
                type="number"
                value={formData.heartRate}
                onChange={(e) => setFormData(prev => ({ ...prev, heartRate: e.target.value }))}
                placeholder="72"
              />
            </div>
            <div>
              <Label>Systolic BP</Label>
              <Input
                type="number"
                value={formData.systolic}
                onChange={(e) => setFormData(prev => ({ ...prev, systolic: e.target.value }))}
                placeholder="120"
              />
            </div>
            <div>
              <Label>Diastolic BP</Label>
              <Input
                type="number"
                value={formData.diastolic}
                onChange={(e) => setFormData(prev => ({ ...prev, diastolic: e.target.value }))}
                placeholder="80"
              />
            </div>
            <div>
              <Label>Respiratory Rate</Label>
              <Input
                type="number"
                value={formData.respiratoryRate}
                onChange={(e) => setFormData(prev => ({ ...prev, respiratoryRate: e.target.value }))}
                placeholder="16"
              />
            </div>
            <div>
              <Label>O2 Saturation (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.oxygenSaturation}
                onChange={(e) => setFormData(prev => ({ ...prev, oxygenSaturation: e.target.value }))}
                placeholder="98"
              />
            </div>
          </div>
          <div>
            <Label>Pain Scale (0-10)</Label>
            <Input
              type="number"
              min="0"
              max="10"
              value={formData.painScale}
              onChange={(e) => setFormData(prev => ({ ...prev, painScale: e.target.value }))}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional observations..."
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>Record Vitals</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};