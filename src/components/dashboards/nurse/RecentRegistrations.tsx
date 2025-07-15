import { useState, useEffect } from "react";
import { format, differenceInYears } from "date-fns";
import { Eye, Activity, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import PatientRegistrationForm from "../../PatientRegistrationForm";
import { VitalsRecordingDialog } from "./VitalsRecordingDialog";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_group?: string;
  allergies?: string;
  medical_history?: string;
  created_at: string;
}

export const RecentRegistrations = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showVitalsDialog, setShowVitalsDialog] = useState(false);
  const [vitalsPatient, setVitalsPatient] = useState<Patient | null>(null);

  useEffect(() => {
    fetchRecentPatients();
  }, []);

  const fetchRecentPatients = async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching recent patients:', error);
    } else {
      setPatients(data || []);
    }
  };

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditing(false);
    setShowPatientDetails(true);
  };

  const handleEditDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditing(true);
    setShowPatientDetails(true);
  };

  const handleCloseDetails = () => {
    setShowPatientDetails(false);
    setSelectedPatient(null);
    setIsEditing(false);
    // Refresh the patient list after editing
    fetchRecentPatients();
  };

  const handleRecordVitals = (patient: Patient) => {
    setVitalsPatient(patient);
    setShowVitalsDialog(true);
  };

  const handleCloseVitals = () => {
    setShowVitalsDialog(false);
    setVitalsPatient(null);
  };

  return (
    <>
      <Card className="bg-card border-border transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Recent Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/50">
                  <TableHead className="font-medium text-muted-foreground">Patient Name</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Date of Birth</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Age</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Gender</TableHead>
                  <TableHead className="font-medium text-muted-foreground w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No recent registrations found
                    </TableCell>
                  </TableRow>
                ) : (
                  patients.map((patient) => (
                    <TableRow 
                      key={patient.id} 
                      className="border-border hover:bg-muted/50 transition-all duration-200 hover:scale-[1.01] hover:shadow-sm"
                    >
                      <TableCell className="font-medium text-foreground">
                        {patient.first_name} {patient.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(patient.date_of_birth), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {differenceInYears(new Date(), new Date(patient.date_of_birth))} years
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {patient.gender}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(patient)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDetails(patient)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRecordVitals(patient)}
                            className="h-8 px-3 text-xs"
                          >
                            <Activity className="h-3 w-3 mr-1" />
                            Record Vitals
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PatientRegistrationForm
        isOpen={showPatientDetails}
        onClose={handleCloseDetails}
        patientData={selectedPatient}
        readOnly={!isEditing}
      />

      <VitalsRecordingDialog
        isOpen={showVitalsDialog}
        onClose={handleCloseVitals}
        patient={vitalsPatient}
      />
    </>
  );
};