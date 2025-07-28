import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Phone, Mail, MapPin, Heart, AlertCircle, Activity } from "lucide-react";

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

interface PatientProfileDialogProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PatientProfileDialog = ({ patient, open, onOpenChange }: PatientProfileDialogProps) => {
  if (!patient) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Profile - {patient.first_name} {patient.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-lg font-semibold">{patient.first_name} {patient.last_name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(patient.date_of_birth)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Age</label>
                  <p className="font-medium">{calculateAge(patient.date_of_birth)} years</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Gender</label>
                <Badge variant="outline" className="mt-1">
                  {patient.gender}
                </Badge>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
                <p className="text-sm">{formatDate(patient.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {patient.phone || 'Not provided'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {patient.email || 'Not provided'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <p className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1" />
                  <span>{patient.address || 'Not provided'}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contact Name</label>
                <p className="font-medium">{patient.emergency_contact_name || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Contact Phone</label>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {patient.emergency_contact_phone || 'Not provided'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Blood Group</label>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <Badge variant="outline" className="font-medium">
                    {patient.blood_group || 'Not specified'}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Allergies</label>
                <div className="p-3 bg-muted rounded-md">
                  {patient.allergies ? (
                    <p className="text-sm">{patient.allergies}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No known allergies</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Medical History</label>
                <div className="p-3 bg-muted rounded-md">
                  {patient.medical_history ? (
                    <p className="text-sm">{patient.medical_history}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No medical history recorded</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};