import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ProcedureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admissionId: string;
  patientId: string;
}

export const ProcedureDialog = ({ open, onOpenChange }: ProcedureDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Procedure</DialogTitle>
        </DialogHeader>
        <div>Coming soon...</div>
      </DialogContent>
    </Dialog>
  );
};