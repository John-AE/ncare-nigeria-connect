import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DoctorNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admissionId: string;
  patientId: string;
}

export const DoctorNoteDialog = ({ open, onOpenChange }: DoctorNoteDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Doctor Note</DialogTitle>
        </DialogHeader>
        <div>Coming soon...</div>
      </DialogContent>
    </Dialog>
  );
};