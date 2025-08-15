/**
 * Inpatient Quick Actions Sidebar
 * 
 * Left sidebar with quick action buttons for common inpatient tasks
 * Each button opens a modal dialog for data entry
 * 
 * @author NCare Nigeria Development Team
 */

import { Button } from '@/components/ui/button';
import { 
  Thermometer, 
  Pill, 
  FileText, 
  ClipboardList,
  Scissors
} from 'lucide-react';

interface InpatientQuickActionsProps {
  onRecordVitals: () => void;
  onAdministerMedication: () => void;
  onCreateDoctorNote?: () => void;
  onCreateNursingNote?: () => void;
  onRecordProcedure: () => void;
  userRole?: string;
}

export const InpatientQuickActions = ({
  onRecordVitals,
  onAdministerMedication,
  onCreateDoctorNote,
  onCreateNursingNote,
  onRecordProcedure,
  userRole
}: InpatientQuickActionsProps) => {
  const actions = [
    {
      label: 'Vital Signs',
      icon: Thermometer,
      onClick: onRecordVitals,
      className: 'bg-blue-500 hover:bg-blue-600 text-white',
      shortcut: 'Alt+V'
    },
    {
      label: 'Medication',
      icon: Pill,
      onClick: onAdministerMedication,
      className: 'bg-green-500 hover:bg-green-600 text-white',
      shortcut: 'Alt+M'
    },
    {
      label: 'Doctor Note',
      icon: FileText,
      onClick: onCreateDoctorNote,
      className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      shortcut: 'Alt+D'
    },
    {
      label: 'Nursing Note',
      icon: ClipboardList,
      onClick: onCreateNursingNote,
      className: 'bg-orange-500 hover:bg-orange-600 text-white',
      shortcut: 'Alt+N'
    },
    {
      label: 'Procedure',
      icon: Scissors,
      onClick: onRecordProcedure,
      className: 'bg-red-500 hover:bg-red-600 text-white',
      shortcut: 'Alt+P'
    }
  ];

  return (
    <div className="w-48 bg-white dark:bg-slate-800 border-r border-border p-3">
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground mb-3">
          Quick Actions
        </div>
        
        {actions.map((action) => {
          // Hide doctor notes for nurses and nursing notes for doctors
          if (action.label === 'Doctor Note' && userRole === 'nurse') return null;
          if (action.label === 'Nursing Note' && userRole === 'doctor') return null;
          
          const IconComponent = action.icon;
          return (
            <Button
              key={action.label}
              onClick={action.onClick}
              className={`w-full justify-start space-x-2 py-3 text-xs ${action.className}`}
              size="sm"
            >
              <IconComponent className="h-4 w-4" />
              <span className="font-medium">{action.label}</span>
            </Button>
          );
        })}
        
        <div className="mt-6 pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Alt + key shortcuts
          </div>
        </div>
      </div>
    </div>
  );
};