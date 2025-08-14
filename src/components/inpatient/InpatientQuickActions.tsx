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
  Stethoscope,
  ClipboardList
} from 'lucide-react';

interface InpatientQuickActionsProps {
  onRecordVitals: () => void;
  onAdministerMedication: () => void;
  onCreateDoctorNote: () => void;
  onCreateNursingNote: () => void;
  onRecordProcedure: () => void;
}

export const InpatientQuickActions = ({
  onRecordVitals,
  onAdministerMedication,
  onCreateDoctorNote,
  onCreateNursingNote,
  onRecordProcedure
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
      icon: Stethoscope,
      onClick: onRecordProcedure,
      className: 'bg-red-500 hover:bg-red-600 text-white',
      shortcut: 'Alt+P'
    }
  ];

  return (
    <div className="w-64 bg-white dark:bg-slate-800 border-r border-border p-4">
      <div className="space-y-4">
        <div className="text-sm font-medium text-muted-foreground mb-4">
          Quick Actions
        </div>
        
        {actions.map((action) => {
          const IconComponent = action.icon;
          return (
            <Button
              key={action.label}
              onClick={action.onClick}
              className={`w-full justify-start space-x-3 py-6 ${action.className}`}
              size="lg"
            >
              <IconComponent className="h-5 w-5" />
              <span className="font-medium">{action.label}</span>
            </Button>
          );
        })}
        
        <div className="mt-8 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Use Alt + key for shortcuts
          </div>
        </div>
      </div>
    </div>
  );
};