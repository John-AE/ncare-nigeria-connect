import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Appointment } from "@/types/recordVisit";

interface PatientInfoCardProps {
  appointment: Appointment;
}

export const PatientInfoCard = ({ appointment }: PatientInfoCardProps) => {
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
            value={`${appointment.patients.first_name} ${appointment.patients.last_name}`}
            disabled
            className="bg-muted"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Date</Label>
            <Input value={appointment.scheduled_date} disabled className="bg-muted" />
          </div>
          <div>
            <Label>Time</Label>
            <Input value={`${appointment.start_time} - ${appointment.end_time}`} disabled className="bg-muted" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};