import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Appointment } from "@/types/recordVisit";

interface PatientInfoCardProps {
  appointment: Appointment;
}

export const PatientInfoCard = ({ appointment }: PatientInfoCardProps) => {
  // Handle different data structures for regular vs walk-in appointments
  const getPatientName = () => {
    // For regular appointments with patient relationship
    if (appointment.patients && appointment.patients.first_name && appointment.patients.last_name) {
      return `${appointment.patients.first_name} ${appointment.patients.last_name}`;
    }
    
    // For walk-in appointments with direct patient name fields
    if (appointment.patient_first_name && appointment.patient_last_name) {
      return `${appointment.patient_first_name} ${appointment.patient_last_name}`;
    }
    
    // Fallback to single patient_name field
    if (appointment.patient_name) {
      return appointment.patient_name;
    }
    
    // Final fallback
    return "Unknown Patient";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Information</CardTitle>
        <CardDescription>Patient details for this visit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="patient-name">Patient Name</Label>
          <Input
            id="patient-name"
            value={getPatientName()}
            disabled
            className="bg-muted"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Date</Label>
            <Input 
              value={appointment.scheduled_date || appointment.visit_date || new Date().toISOString().split('T')[0]} 
              disabled 
              className="bg-muted" 
            />
          </div>
          <div>
            <Label>Time</Label>
            <Input 
              value={
                appointment.start_time && appointment.end_time 
                  ? `${appointment.start_time} - ${appointment.end_time}`
                  : appointment.visit_time || "Walk-in"
              } 
              disabled 
              className="bg-muted" 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};