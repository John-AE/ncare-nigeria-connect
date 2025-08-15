import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface NursingNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admissionId: string;
  patientId: string;
  onSuccess?: () => void;
}

export const NursingNoteDialog = ({ open, onOpenChange, admissionId, patientId, onSuccess }: NursingNoteDialogProps) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both title and content for the note.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('inpatient_notes')
        .insert({
          admission_id: admissionId,
          patient_id: patientId,
          hospital_id: profile?.hospital_id,
          note_type: 'nursing',
          title: formData.title.trim(),
          content: formData.content.trim(),
          created_by: profile?.user_id,
        });

      if (error) throw error;

      toast({
        title: "Nursing note created successfully",
        description: "The note has been added to the patient's timeline.",
      });

      // Reset form
      setFormData({ title: '', content: '' });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating nursing note:', error);
      toast({
        title: "Error",
        description: "Failed to create nursing note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Nursing Note</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Note Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter note title..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Note Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter detailed note content..."
              rows={8}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};