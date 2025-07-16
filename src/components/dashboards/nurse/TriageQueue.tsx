import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, Activity, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PatientWithVitals {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  vital_signs: {
    body_temperature: number | null;
    heart_rate: number | null;
    blood_pressure_systolic: number | null;
    blood_pressure_diastolic: number | null;
    oxygen_saturation: number | null;
    recorded_at: string;
  };
  appointments: {
    id: string;
    start_time: string;
    scheduled_date: string;
  } | null;
  priority_score: number;
}

interface TriageQueueProps {
  showRecordVisitButton?: boolean;
  showVitalSigns?: boolean;
}

// Priority scoring function based on vital signs
const calculatePriorityScore = (vitals: PatientWithVitals['vital_signs']): number => {
  let score = 0;
  
  // Temperature scoring (normal: 36.1-37.2°C)
  if (vitals.body_temperature) {
    if (vitals.body_temperature < 35 || vitals.body_temperature > 39) score += 3;
    else if (vitals.body_temperature < 36 || vitals.body_temperature > 38) score += 2;
    else if (vitals.body_temperature < 36.1 || vitals.body_temperature > 37.2) score += 1;
  }
  
  // Heart rate scoring (normal: 60-100 bpm)
  if (vitals.heart_rate) {
    if (vitals.heart_rate < 50 || vitals.heart_rate > 120) score += 3;
    else if (vitals.heart_rate < 60 || vitals.heart_rate > 100) score += 2;
  }
  
  // Blood pressure scoring (normal: <120/<80 mmHg)
  if (vitals.blood_pressure_systolic && vitals.blood_pressure_diastolic) {
    if (vitals.blood_pressure_systolic > 180 || vitals.blood_pressure_diastolic > 110) score += 3;
    else if (vitals.blood_pressure_systolic > 140 || vitals.blood_pressure_diastolic > 90) score += 2;
    else if (vitals.blood_pressure_systolic > 120 || vitals.blood_pressure_diastolic > 80) score += 1;
  }
  
  // Oxygen saturation scoring (normal: >95%)
  if (vitals.oxygen_saturation) {
    if (vitals.oxygen_saturation < 90) score += 3;
    else if (vitals.oxygen_saturation < 95) score += 2;
    else if (vitals.oxygen_saturation < 98) score += 1;
  }
  
  return score;
};

const getPriorityBadge = (score: number) => {
  if (score >= 6) return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Critical</Badge>;
  if (score >= 3) return <Badge variant="secondary" className="flex items-center gap-1"><Activity className="h-3 w-3" />High</Badge>;
  if (score >= 1) return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" />Medium</Badge>;
  return <Badge variant="default" className="flex items-center gap-1"><Clock className="h-3 w-3" />Low</Badge>;
};

export const TriageQueue = ({ showRecordVisitButton = false, showVitalSigns = false }: TriageQueueProps) => {
  const [queuePatients, setQueuePatients] = useState<PatientWithVitals[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchQueuePatients = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
      
      // First, get vital signs recorded today
      const { data: vitalSignsData, error: vitalSignsError } = await supabase
        .from('vital_signs')
        .select('*')
        .gte('recorded_at', startOfDay)
        .lt('recorded_at', endOfDay)
        .order('recorded_at', { ascending: true });

      if (vitalSignsError) throw vitalSignsError;

      if (!vitalSignsData || vitalSignsData.length === 0) {
        setQueuePatients([]);
        return;
      }

      // Get patient data for these vital signs
      const patientIds = vitalSignsData.map(vs => vs.patient_id);
      
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('id, first_name, last_name, gender, date_of_birth')
        .in('id', patientIds);

      if (patientsError) throw patientsError;

      // Get appointment data for these patients
      let appointmentsData = [];
      if (patientIds.length > 0) {
        const { data: apptData, error: apptError } = await supabase
          .from('appointments')
          .select('id, patient_id, start_time, scheduled_date')
          .in('patient_id', patientIds)
          .eq('scheduled_date', today.toISOString().split('T')[0])
          .neq('status', 'completed');
        
        if (apptError) console.warn('Error fetching appointments:', apptError);
        appointmentsData = apptData || [];
      }

      // Process and sort patients
      const processedPatients = vitalSignsData.map(vitalRecord => {
        const patient = patientsData?.find(p => p.id === vitalRecord.patient_id);
        const appointment = appointmentsData.find(apt => apt.patient_id === vitalRecord.patient_id);
        
        if (!patient) return null; // Skip if patient not found
        
        const vitals = {
          body_temperature: vitalRecord.body_temperature,
          heart_rate: vitalRecord.heart_rate,
          blood_pressure_systolic: vitalRecord.blood_pressure_systolic,
          blood_pressure_diastolic: vitalRecord.blood_pressure_diastolic,
          oxygen_saturation: vitalRecord.oxygen_saturation,
          recorded_at: vitalRecord.recorded_at
        };
        
        return {
          id: patient.id,
          first_name: patient.first_name,
          last_name: patient.last_name,
          gender: patient.gender,
          date_of_birth: patient.date_of_birth,
          vital_signs: vitals,
          appointments: appointment || null,
          priority_score: calculatePriorityScore(vitals)
        };
      }).filter(Boolean) as PatientWithVitals[]; // Remove null entries

      // Sort by: 1) Priority score (desc), 2) Vitals recorded time (asc), 3) Appointment time (asc)
      processedPatients.sort((a, b) => {
        if (a.priority_score !== b.priority_score) {
          return b.priority_score - a.priority_score;
        }
        
        if (a.vital_signs.recorded_at !== b.vital_signs.recorded_at) {
          return new Date(a.vital_signs.recorded_at).getTime() - new Date(b.vital_signs.recorded_at).getTime();
        }
        
        if (a.appointments?.start_time && b.appointments?.start_time) {
          return a.appointments.start_time.localeCompare(b.appointments.start_time);
        }
        
        return 0;
      });

      setQueuePatients(processedPatients);
    } catch (error) {
      console.error('Error fetching queue patients:', error);
      toast({
        title: "Error",
        description: "Failed to load triage queue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueuePatients();

    // Set up real-time subscription for vital signs updates
    const channel = supabase
      .channel('triage-queue-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vital_signs'
        },
        () => fetchQueuePatients()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Triage Assessment / Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading queue...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Triage Assessment / Queue
          <Badge variant="outline" className="ml-auto">
            {queuePatients.length} patients
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {queuePatients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No patients in queue. Patients will appear here after vital signs are recorded.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Queue #</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Age/Gender</TableHead>
                <TableHead>Priority</TableHead>
                {showVitalSigns && <TableHead>Temp (°C)</TableHead>}
                {showVitalSigns && <TableHead>HR (bpm)</TableHead>}
                {showVitalSigns && <TableHead>BP (mmHg)</TableHead>}
                {showVitalSigns && <TableHead>O2 Sat (%)</TableHead>}
                <TableHead>Vitals Recorded</TableHead>
                <TableHead>Appointment Time</TableHead>
                {showRecordVisitButton && <TableHead>Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {queuePatients.map((patient, index) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">#{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {patient.first_name} {patient.last_name}
                  </TableCell>
                  <TableCell>
                    {calculateAge(patient.date_of_birth)}y / {patient.gender}
                  </TableCell>
                  <TableCell>
                    {getPriorityBadge(patient.priority_score)}
                  </TableCell>
                  {showVitalSigns && (
                    <TableCell className="text-sm">
                      {patient.vital_signs.body_temperature?.toFixed(1) || 'N/A'}
                    </TableCell>
                  )}
                  {showVitalSigns && (
                    <TableCell className="text-sm">
                      {patient.vital_signs.heart_rate || 'N/A'}
                    </TableCell>
                  )}
                  {showVitalSigns && (
                    <TableCell className="text-sm">
                      {patient.vital_signs.blood_pressure_systolic && patient.vital_signs.blood_pressure_diastolic
                        ? `${patient.vital_signs.blood_pressure_systolic}/${patient.vital_signs.blood_pressure_diastolic}`
                        : 'N/A'}
                    </TableCell>
                  )}
                  {showVitalSigns && (
                    <TableCell className="text-sm">
                      {patient.vital_signs.oxygen_saturation?.toFixed(1) || 'N/A'}
                    </TableCell>
                  )}
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(patient.vital_signs.recorded_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {patient.appointments?.start_time || 'Walk-in'}
                  </TableCell>
                   {showRecordVisitButton && (
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (patient.appointments?.id) {
                            navigate(`/record-visit/${patient.appointments.id}`);
                          } else {
                            // For walk-in patients, we'll need to create a temporary appointment or handle differently
                            // For now, we'll use the patient ID to navigate to a walk-in visit recording
                            navigate(`/record-visit/walk-in/${patient.id}`);
                          }
                        }}
                        className="text-xs"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Record Visit
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};