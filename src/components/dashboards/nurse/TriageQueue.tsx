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
    complaints: string | null;
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
  refreshTrigger?: React.MutableRefObject<(() => void) | null>;
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

export const TriageQueue = ({ showRecordVisitButton = false, showVitalSigns = false, refreshTrigger }: TriageQueueProps) => {
  const [queuePatients, setQueuePatients] = useState<PatientWithVitals[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchQueuePatients();
    
    // Simple real-time listener like your Scheduled Patients Queue
    const channel = supabase
      .channel('triage-queue-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vital_signs'
        },
        () => {
          console.log('New vital signs recorded');
          setTimeout(() => {
            fetchQueuePatients();
          }, 500);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vital_signs'
        },
        () => {
          console.log('Vital signs updated');
          setTimeout(() => {
            fetchQueuePatients();
          }, 500);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'visits'
        },
        () => {
          console.log('New visit recorded');
          setTimeout(() => {
            fetchQueuePatients();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Expose refresh function via refreshTrigger ref
  useEffect(() => {
    if (refreshTrigger) {
      refreshTrigger.current = fetchQueuePatients;
    }
  }, [refreshTrigger]);

  const fetchQueuePatients = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
      
      // Get vital signs recorded today with patient data
      const { data: vitalSignsData, error: vitalSignsError } = await supabase
        .from('vital_signs')
        .select(`
          id,
          patient_id,
          body_temperature,
          heart_rate,
          blood_pressure_systolic,
          blood_pressure_diastolic,
          oxygen_saturation,
          recorded_at,
          complaints,
          patients (
            id,
            first_name,
            last_name,
            gender,
            date_of_birth
          )
        `)
        .gte('recorded_at', startOfDay)
        .lt('recorded_at', endOfDay)
        .order('recorded_at', { ascending: true });

      if (vitalSignsError) {
        console.error('Vital signs error:', vitalSignsError);
        throw vitalSignsError;
      }

      if (!vitalSignsData || vitalSignsData.length === 0) {
        setQueuePatients([]);
        return;
      }

      // Get patient IDs who already have completed visits today
      const patientIds = vitalSignsData.map(vs => vs.patient_id).filter(Boolean);
      
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select('patient_id')
        .in('patient_id', patientIds)
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay);
      
      if (visitsError) {
        console.error('Error fetching visits:', visitsError);
      }

      // Get appointments for today
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id, patient_id, start_time, scheduled_date')
        .in('patient_id', patientIds)
        .eq('scheduled_date', today.toISOString().split('T')[0])
        .neq('status', 'completed');
      
      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
      }

      // Filter out patients who already have completed visits today
      const completedVisitPatientIds = new Set(visitsData?.map(v => v.patient_id) || []);
      const patientsWithoutVisits = vitalSignsData.filter(
        vs => !completedVisitPatientIds.has(vs.patient_id)
      );

      // Process and sort patients
      const processedPatients: PatientWithVitals[] = patientsWithoutVisits
        .filter(vitalRecord => vitalRecord.patients) // Only include records with patient data
        .map(vitalRecord => {
          const appointment = appointmentsData?.find(apt => apt.patient_id === vitalRecord.patient_id) || null;
          
          const vitals = {
            body_temperature: vitalRecord.body_temperature,
            heart_rate: vitalRecord.heart_rate,
            blood_pressure_systolic: vitalRecord.blood_pressure_systolic,
            blood_pressure_diastolic: vitalRecord.blood_pressure_diastolic,
            oxygen_saturation: vitalRecord.oxygen_saturation,
            recorded_at: vitalRecord.recorded_at,
            complaints: vitalRecord.complaints
          };
          
          return {
            id: vitalRecord.patients.id,
            first_name: vitalRecord.patients.first_name,
            last_name: vitalRecord.patients.last_name,
            gender: vitalRecord.patients.gender,
            date_of_birth: vitalRecord.patients.date_of_birth,
            vital_signs: vitals,
            appointments: appointment,
            priority_score: calculatePriorityScore(vitals)
          };
        });

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
        description: "Failed to load triage queue. Please try again.",
        variant: "destructive",
      });
      setQueuePatients([]);
    } finally {
      setLoading(false);
    }
  };

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
      <Card className="border-l-8 border-l-[#EF4444]">
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
    <Card className="border-l-8 border-l-[#EF4444]">
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
                <TableHead>Complaints</TableHead>
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
                  <TableCell className="max-w-48">
                    {patient.vital_signs.complaints ? (
                      <div className="text-sm">
                        <span className="block truncate" title={patient.vital_signs.complaints}>
                          {patient.vital_signs.complaints}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">No complaints recorded</span>
                    )}
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