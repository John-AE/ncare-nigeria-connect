import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AppointmentManagementProps {
  onScheduleAppointment: () => void;
}

export const AppointmentManagement = ({ onScheduleAppointment }: AppointmentManagementProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointment Scheduling</CardTitle>
        <CardDescription>Book and manage doctor appointments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          className="w-full justify-start" 
          size="lg"
          onClick={onScheduleAppointment}
        >
          Schedule New Appointment
        </Button>
        <Button variant="outline" className="w-full justify-start" size="lg">
          View Today&apos;s Schedule
        </Button>
        <Button variant="outline" className="w-full justify-start" size="lg">
          Reschedule Appointments
        </Button>
      </CardContent>
    </Card>
  );
};