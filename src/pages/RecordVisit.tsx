import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRecordVisit } from "@/hooks/useRecordVisit";
import { PatientInfoCard } from "@/components/record-visit/PatientInfoCard";
import { VisitDetailsCard } from "@/components/record-visit/VisitDetailsCard";
import { ServicesManagementCard } from "@/components/record-visit/ServicesManagementCard";
import { BillPreviewCard } from "@/components/record-visit/BillPreviewCard";

export const RecordVisit = () => {
  const { appointmentId } = useParams();
  const {
    appointment,
    services,
    loading,
    saving,
    visitData,
    setVisitData,
    prescriptions,
    setPrescriptions,
    showBillPreview,
    setShowBillPreview,
    showServiceDialog,
    setShowServiceDialog,
    newService,
    setNewService,
    editingService,
    setEditingService,
    addPrescription,
    removePrescription,
    updatePrescription,
    addCustomPrescription,
    removeCustomPrescription,
    customPrescriptions,
    calculateTotal,
    saveService,
    handleSaveVisit,
    navigate,
    profile
  } = useRecordVisit(appointmentId);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Appointment not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/doctor-dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Record Visit</h1>
          <p className="text-muted-foreground">
            {appointment.scheduled_date} at {appointment.start_time} - {appointment.end_time}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PatientInfoCard appointment={appointment} />
        <VisitDetailsCard visitData={visitData} setVisitData={setVisitData} />
      </div>

      <ServicesManagementCard
        services={services}
        prescriptions={prescriptions}
        addPrescription={addPrescription}
        removePrescription={removePrescription}
        updatePrescription={updatePrescription}
        showServiceDialog={showServiceDialog}
        setShowServiceDialog={setShowServiceDialog}
        newService={newService}
        setNewService={setNewService}
        editingService={editingService}
        setEditingService={setEditingService}
        saveService={saveService}
      />

      <BillPreviewCard
        prescriptions={prescriptions}
        customPrescriptions={customPrescriptions}
        services={services}
        calculateTotal={calculateTotal}
        showBillPreview={showBillPreview}
        setShowBillPreview={setShowBillPreview}
        appointment={appointment}
        handleSaveVisit={handleSaveVisit}
        saving={saving}
        profile={profile}
        addCustomPrescription={addCustomPrescription}
        removeCustomPrescription={removeCustomPrescription}
      />

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate('/doctor-dashboard')}>
          Cancel
        </Button>
        <Button onClick={() => setShowBillPreview(true)} disabled={prescriptions.length === 0}>
          Save Visit & Preview Bill
        </Button>
      </div>
    </div>
  );
};