import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdmitPatientDialogProps {
  patient: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AdmitPatientDialog = ({ 
  patient, 
  open, 
  onOpenChange, 
  onSuccess 
}: AdmitPatientDialogProps) => {
  const [formData, setFormData] = useState({
    admission_reason: "",
    admitting_diagnosis: "",
    room_number: "",
    bed_number: "",
    attending_doctor_id: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);

  // Fetch doctors when dialog opens
  const fetchDoctors = async () => {
    try {
      console.log('Fetching doctors...');
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username')
        .eq('role', 'doctor')
        .eq('is_active', true);
      
      if (error) throw error;
      console.log('Fetched doctors:', data);
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  // Fetch doctors when component mounts or dialog opens
  useEffect(() => {
    if (open) {
      fetchDoctors();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !formData.attending_doctor_id) return;

    setIsSubmitting(true);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('hospital_id')
        .eq('user_id', currentUser.user?.id)
        .single();

      const { error } = await supabase
        .from('inpatient_admissions')
        .insert({
          patient_id: patient.id,
          hospital_id: profile?.hospital_id,
          admission_reason: formData.admission_reason,
          admitting_diagnosis: formData.admitting_diagnosis,
          room_number: formData.room_number || null,
          bed_number: formData.bed_number || null,
          attending_doctor_id: formData.attending_doctor_id,
          created_by: currentUser.user?.id,
          admission_date: new Date().toISOString(),
          status: 'active'
        });

      if (error) throw error;

      setFormData({
        admission_reason: "",
        admitting_diagnosis: "",
        room_number: "",
        bed_number: "",
        attending_doctor_id: ""
      });
      onSuccess();
    } catch (error) {
      console.error('Error admitting patient:', error);
      toast.error("Failed to admit patient. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Admit Patient</DialogTitle>
          <DialogDescription>
            {patient && `Admit ${patient.first_name} ${patient.last_name} as an inpatient`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admission_reason">Admission Reason *</Label>
            <Textarea
              id="admission_reason"
              value={formData.admission_reason}
              onChange={(e) => setFormData(prev => ({ ...prev, admission_reason: e.target.value }))}
              placeholder="Enter reason for admission..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admitting_diagnosis">Admitting Diagnosis</Label>
            <Textarea
              id="admitting_diagnosis"
              value={formData.admitting_diagnosis}
              onChange={(e) => setFormData(prev => ({ ...prev, admitting_diagnosis: e.target.value }))}
              placeholder="Enter preliminary diagnosis..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attending_doctor_id">Attending Doctor *</Label>
            <Select
              value={formData.attending_doctor_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, attending_doctor_id: value }))}
              required
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={doctors.length === 0 ? "Loading doctors..." : "Select attending doctor"} />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.user_id} value={doctor.user_id}>
                    {doctor.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room_number">Room Number</Label>
              <Input
                id="room_number"
                value={formData.room_number}
                onChange={(e) => setFormData(prev => ({ ...prev, room_number: e.target.value }))}
                placeholder="e.g., 101"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bed_number">Bed Number</Label>
              <Input
                id="bed_number"
                value={formData.bed_number}
                onChange={(e) => setFormData(prev => ({ ...prev, bed_number: e.target.value }))}
                placeholder="e.g., A"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.admission_reason || !formData.attending_doctor_id}
            >
              {isSubmitting ? "Admitting..." : "Admit Patient"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};