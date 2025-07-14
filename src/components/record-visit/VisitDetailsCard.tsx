import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VisitData } from "@/types/recordVisit";

interface VisitDetailsCardProps {
  visitData: VisitData;
  setVisitData: (data: VisitData) => void;
}

export const VisitDetailsCard = ({ visitData, setVisitData }: VisitDetailsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visit Details</CardTitle>
        <CardDescription>Record the details of this patient visit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="complaints">Patient Complaints</Label>
          <Textarea
            id="complaints"
            placeholder="Enter patient complaints..."
            value={visitData.complaints}
            onChange={(e) => setVisitData({...visitData, complaints: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="diagnosis">Diagnosis</Label>
          <Textarea
            id="diagnosis"
            placeholder="Enter diagnosis..."
            value={visitData.diagnosis}
            onChange={(e) => setVisitData({...visitData, diagnosis: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="treatment-plan">Treatment Plan</Label>
          <Textarea
            id="treatment-plan"
            placeholder="Enter treatment plan..."
            value={visitData.treatment_plan}
            onChange={(e) => setVisitData({...visitData, treatment_plan: e.target.value})}
          />
        </div>
      </CardContent>
    </Card>
  );
};