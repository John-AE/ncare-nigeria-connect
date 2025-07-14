import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { Service, Prescription } from "@/types/recordVisit";
import { BillPreviewDialog } from "./BillPreviewDialog";

interface BillPreviewCardProps {
  prescriptions: Prescription[];
  services: Service[];
  calculateTotal: () => number;
  showBillPreview: boolean;
  setShowBillPreview: (show: boolean) => void;
  appointment: any;
  handleSaveVisit: () => void;  
  saving: boolean;
  profile: any;
}

export const BillPreviewCard = ({
  prescriptions,
  services,
  calculateTotal,
  showBillPreview,
  setShowBillPreview,
  appointment,
  handleSaveVisit,
  saving,
  profile
}: BillPreviewCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Patient Billing
        </CardTitle>
        <CardDescription>Review and generate bill for this visit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <BillPreviewDialog
            showBillPreview={showBillPreview}
            setShowBillPreview={setShowBillPreview}
            prescriptions={prescriptions}
            appointment={appointment}
            services={services}
            calculateTotal={calculateTotal}
            handleSaveVisit={handleSaveVisit}
            saving={saving}
            profile={profile}
          />
        </div>
        
        {prescriptions.length > 0 && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Current Bill Summary</h4>
            <div className="space-y-1">
              {prescriptions.filter(p => p.serviceId).map((prescription, index) => {
                const service = services.find(s => s.id === prescription.serviceId);
                if (!service) return null;
                return (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{service.name} x{prescription.quantity}</span>
                    <span>₦{(service.price * prescription.quantity).toLocaleString()}</span>
                  </div>
                );
              })}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span>₦{calculateTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};