import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MedicationSelector } from '@/components/record-visit/MedicationSelector';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface MedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admissionId: string;
  patientId: string;
  onSuccess?: () => void;
}

interface MedicationItem {
  id: string;
  medication_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export const MedicationDialog = ({ open, onOpenChange, admissionId, patientId, onSuccess }: MedicationDialogProps) => {
  const [medicationItems, setMedicationItems] = useState<MedicationItem[]>([]);
  const [dosage, setDosage] = useState('');
  const [route, setRoute] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  const handleAdministerMedication = async () => {
    if (medicationItems.length === 0) {
      toast({
        title: "No medications selected",
        description: "Please select at least one medication to administer.",
        variant: "destructive",
      });
      return;
    }

    if (!dosage || !route) {
      toast({
        title: "Missing information",
        description: "Please fill in dosage and route for the medication.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // For now, we'll create one record per selected medication
      // In the future, this could be enhanced to handle different dosages per medication
      for (const medication of medicationItems) {
        const { error } = await supabase
          .from('inpatient_medications')
          .insert({
            admission_id: admissionId,
            patient_id: patientId,
            hospital_id: profile?.hospital_id,
            medication_name: medication.medication_name,
            dosage: dosage,
            route: route,
            notes: notes,
            administered_by: profile?.user_id,
            administered_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      toast({
        title: "Medications administered successfully",
        description: "The medications have been recorded in the patient's timeline.",
      });

      // Reset form
      setMedicationItems([]);
      setDosage('');
      setRoute('');
      setNotes('');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error administering medication:', error);
      toast({
        title: "Error",
        description: "Failed to record medication administration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Administer Medication</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Medication Selection */}
          <MedicationSelector
            medicationItems={medicationItems}
            setMedicationItems={setMedicationItems}
          />

          {/* Administration Details */}
          {medicationItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g., 500mg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="route">Route</Label>
                <Select value={route} onValueChange={setRoute}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oral">Oral</SelectItem>
                    <SelectItem value="iv">Intravenous (IV)</SelectItem>
                    <SelectItem value="im">Intramuscular (IM)</SelectItem>
                    <SelectItem value="sc">Subcutaneous (SC)</SelectItem>
                    <SelectItem value="topical">Topical</SelectItem>
                    <SelectItem value="inhaled">Inhaled</SelectItem>
                    <SelectItem value="rectal">Rectal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes about the medication administration..."
                  rows={3}
                />
              </div>

              <div className="md:col-span-2 flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAdministerMedication}
                  disabled={loading}
                >
                  {loading ? 'Recording...' : 'Administer Medication'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};