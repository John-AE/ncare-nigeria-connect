import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { Service, NewService } from "@/types/recordVisit";

interface ServiceManagementDialogProps {
  showServiceDialog: boolean;
  setShowServiceDialog: (show: boolean) => void;
  newService: NewService;
  setNewService: (service: NewService) => void;
  editingService: Service | null;
  setEditingService: (service: Service | null) => void;
  services: Service[];
  saveService: () => void;
}

export const ServiceManagementDialog = ({
  showServiceDialog,
  setShowServiceDialog,
  newService,
  setNewService,
  editingService,
  setEditingService,
  services,
  saveService
}: ServiceManagementDialogProps) => {
  return (
    <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Manage Services
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Services</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serviceName">Service Name</Label>
              <Input
                id="serviceName"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                placeholder="Enter service name"
              />
            </div>
            <div>
              <Label htmlFor="servicePrice">Price (₦)</Label>
              <Input
                id="servicePrice"
                type="number"
                value={newService.price}
                onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                placeholder="Enter price"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="serviceDescription">Description</Label>
            <Input
              id="serviceDescription"
              value={newService.description}
              onChange={(e) => setNewService({ ...newService, description: e.target.value })}
              placeholder="Enter description"
            />
          </div>
          <div>
            <Label htmlFor="serviceCategory">Category</Label>
            <Input
              id="serviceCategory"
              value={newService.category}
              onChange={(e) => setNewService({ ...newService, category: e.target.value })}
              placeholder="Enter category"
            />
          </div>
          <Button onClick={saveService} className="w-full">
            {editingService ? "Update Service" : "Add Service"}
          </Button>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Existing Services</h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {services.map(service => (
                <div key={service.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">₦{service.price.toLocaleString()}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setEditingService(service);
                      setNewService({
                        name: service.name,
                        description: service.description || "",
                        price: service.price,
                        category: service.category || ""
                      });
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};