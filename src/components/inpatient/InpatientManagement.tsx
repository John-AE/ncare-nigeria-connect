/**
 * Inpatient Management Component
 * 
 * Comprehensive single-page inpatient management system featuring:
 * - Patient selection and admission overview
 * - Quick action buttons for data entry
 * - Central timeline of all patient events
 * - Current vitals summary
 * - Real-time updates and search functionality
 * 
 * @author NCare Nigeria Development Team
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Thermometer, 
  Pill, 
  FileText, 
  Stethoscope,
  Activity,
  Calendar,
  User,
  MapPin,
  Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DashboardToggle } from '../DashboardToggle';
import { InpatientQuickActions } from './InpatientQuickActions';
import { InpatientTimeline } from './InpatientTimeline';
import { InpatientVitalsPanel } from './InpatientVitalsPanel';
import { VitalsDialog } from './dialogs/VitalsDialog';
import { MedicationDialog } from './dialogs/MedicationDialog';
import { DoctorNoteDialog } from './dialogs/DoctorNoteDialog';
import { NursingNoteDialog } from './dialogs/NursingNoteDialog';
import { ProcedureDialog } from './dialogs/ProcedureDialog';
import { format } from 'date-fns';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  blood_group?: string;
  allergies?: string;
}

interface InpatientAdmission {
  id: string;
  patient: Patient;
  room_number?: string;
  admission_date: string;
  admission_reason?: string;
  attending_doctor_id: string;
  admitting_diagnosis?: string;
  status: string;
}

interface InpatientManagementProps {
  onNavigate?: (mode: 'outpatients' | 'inpatients' | 'timeline') => void;
}

export const InpatientManagement = ({ onNavigate }: InpatientManagementProps) => {
  const { profile } = useAuth();
  const [admissions, setAdmissions] = useState<InpatientAdmission[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<InpatientAdmission | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [vitalsDialogOpen, setVitalsDialogOpen] = useState(false);
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false);
  const [doctorNoteDialogOpen, setDoctorNoteDialogOpen] = useState(false);
  const [nursingNoteDialogOpen, setNursingNoteDialogOpen] = useState(false);
  const [procedureDialogOpen, setProcedureDialogOpen] = useState(false);

  // Fetch active admissions
  const fetchAdmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('inpatient_admissions')
        .select(`
          *,
          patients (
            id,
            first_name,
            last_name,
            date_of_birth,
            gender,
            blood_group,
            allergies
          )
        `)
        .eq('hospital_id', profile?.hospital_id)
        .eq('status', 'active')
        .order('admission_date', { ascending: false });

      if (error) throw error;
      
      const admissionsData = data?.map(admission => ({
        ...admission,
        patient: admission.patients as Patient
      })) as InpatientAdmission[] || [];
      
      setAdmissions(admissionsData);
      if (admissionsData.length > 0 && !selectedAdmission) {
        setSelectedAdmission(admissionsData[0]);
      }
    } catch (error) {
      console.error('Error fetching admissions:', error);
      toast({
        title: "Error",
        description: "Failed to load patient admissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.hospital_id) {
      fetchAdmissions();
    }
  }, [profile?.hospital_id]);

  const filteredAdmissions = admissions.filter(admission =>
    `${admission.patient.first_name} ${admission.patient.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
    admission.room_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admission.admitting_diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading inpatients...</div>
      </div>
    );
  }

  if (admissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-muted-foreground text-lg">No active inpatients</div>
        <div className="text-sm text-muted-foreground">
          There are currently no patients admitted to this hospital
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation Header */}
      {onNavigate && (
        <div className="bg-white dark:bg-slate-800 border-b border-border shadow-sm">
          <DashboardToggle 
            viewMode="inpatients" 
            onToggle={onNavigate} 
          />
        </div>
      )}
      
      <div className="flex h-full">
        {/* Left Sidebar - Patient Selection */}
        <div className="w-64 bg-white dark:bg-slate-800 border-r border-border shadow-sm">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="overflow-auto h-full pb-20">
            {filteredAdmissions.map((admission) => (
              <div
                key={admission.id}
                onClick={() => setSelectedAdmission(admission)}
                className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedAdmission?.id === admission.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getPatientInitials(admission.patient.first_name, admission.patient.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {admission.patient.first_name} {admission.patient.last_name}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center space-x-2">
                      <span>Age {calculateAge(admission.patient.date_of_birth)}</span>
                      {admission.room_number && (
                        <>
                          <span>•</span>
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            Room {admission.room_number}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Admitted {format(new Date(admission.admission_date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                {admission.admitting_diagnosis && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {admission.admitting_diagnosis}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        {selectedAdmission && (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-border p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {getPatientInitials(selectedAdmission.patient.first_name, selectedAdmission.patient.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      {selectedAdmission.patient.first_name} {selectedAdmission.patient.last_name}
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        Age {calculateAge(selectedAdmission.patient.date_of_birth)} • {selectedAdmission.patient.gender}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Admitted {format(new Date(selectedAdmission.admission_date), 'MMM dd, yyyy')}
                      </span>
                      {selectedAdmission.room_number && (
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          Room {selectedAdmission.room_number}
                        </span>
                      )}
                    </div>
                    {selectedAdmission.admitting_diagnosis && (
                      <div className="mt-2">
                        <Badge variant="secondary">{selectedAdmission.admitting_diagnosis}</Badge>
                      </div>
                    )}
                    {selectedAdmission.patient.allergies && (
                      <div className="mt-1">
                        <Badge variant="destructive" className="text-xs">
                          Allergies: {selectedAdmission.patient.allergies}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge variant="outline" className="mb-2">
                    <Activity className="h-3 w-3 mr-1" />
                    {selectedAdmission.status.toUpperCase()}
                  </Badge>
                  {selectedAdmission.patient.blood_group && (
                    <div className="text-sm text-muted-foreground">
                      Blood Type: <span className="font-medium">{selectedAdmission.patient.blood_group}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex">
              {/* Quick Actions Sidebar */}
              <InpatientQuickActions
                onRecordVitals={() => setVitalsDialogOpen(true)}
                onAdministerMedication={() => setMedicationDialogOpen(true)}
                onCreateDoctorNote={() => setDoctorNoteDialogOpen(true)}
                onCreateNursingNote={() => setNursingNoteDialogOpen(true)}
                onRecordProcedure={() => setProcedureDialogOpen(true)}
              />

              {/* Timeline */}
              <div className="flex-1">
                <InpatientTimeline admissionId={selectedAdmission.id} />
              </div>

              {/* Right Panel - Current Vitals */}
              <InpatientVitalsPanel admissionId={selectedAdmission.id} />
            </div>
          </div>
        )}
      </div>

      {/* Dialog Components */}
      {selectedAdmission && (
        <>
          <VitalsDialog
            open={vitalsDialogOpen}
            onOpenChange={setVitalsDialogOpen}
            admissionId={selectedAdmission.id}
            patientId={selectedAdmission.patient.id}
          />
          
          <MedicationDialog
            open={medicationDialogOpen}
            onOpenChange={setMedicationDialogOpen}
            admissionId={selectedAdmission.id}
            patientId={selectedAdmission.patient.id}
          />
          
          <DoctorNoteDialog
            open={doctorNoteDialogOpen}
            onOpenChange={setDoctorNoteDialogOpen}
            admissionId={selectedAdmission.id}
            patientId={selectedAdmission.patient.id}
          />
          
          <NursingNoteDialog
            open={nursingNoteDialogOpen}
            onOpenChange={setNursingNoteDialogOpen}
            admissionId={selectedAdmission.id}
            patientId={selectedAdmission.patient.id}
          />
          
          <ProcedureDialog
            open={procedureDialogOpen}
            onOpenChange={setProcedureDialogOpen}
            admissionId={selectedAdmission.id}
            patientId={selectedAdmission.patient.id}
          />
        </>
      )}
    </div>
  );
};