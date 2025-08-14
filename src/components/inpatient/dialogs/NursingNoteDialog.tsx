import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface NursingNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admissionId: string;
  patientId: string;
}

export const NursingNoteDialog = ({ open, onOpenChange }: NursingNoteDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nursing Note</DialogTitle>
        </DialogHeader>
        <div>Coming soon...</div>
      </DialogContent>
    </Dialog>
  );
};