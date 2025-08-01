import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TestType {
  id?: string;
  name: string;
  code: string;
  category: string;
  sample_type: string;
  price: number;
  turnaround_time_hours: number;
  normal_range?: string;
  unit?: string;
  preparation_instructions?: string;
  description?: string;
  hospital_id?: string;
}

interface TestTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testType?: TestType | null;
  onSuccess: () => void;
}

export const TestTypeDialog = ({ open, onOpenChange, testType, onSuccess }: TestTypeDialogProps) => {
  const [formData, setFormData] = useState<TestType>({
    name: "",
    code: "",
    category: "",
    sample_type: "",
    price: 0,
    turnaround_time_hours: 24,
    normal_range: "",
    unit: "",
    preparation_instructions: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (testType) {
      setFormData(testType);
    } else {
      setFormData({
        name: "",
        code: "",
        category: "",
        sample_type: "",
        price: 0,
        turnaround_time_hours: 24,
        normal_range: "",
        unit: "",
        preparation_instructions: "",
        description: "",
      });
    }
  }, [testType, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (testType?.id) {
        // Update existing test type
        const { error } = await supabase
          .from("lab_test_types")
          .update(formData)
          .eq("id", testType.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Test type updated successfully",
        });
      } else {
        // Get current user's hospital_id for new test types
        const { data: profile } = await supabase
          .from("profiles")
          .select("hospital_id")
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
          .single();
        
        if (!profile?.hospital_id) {
          throw new Error("Hospital ID not found");
        }

        // Create new test type with hospital_id
        const { error } = await supabase
          .from("lab_test_types")
          .insert({
            ...formData,
            hospital_id: profile.hospital_id,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Test type created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving test type:", error);
      toast({
        title: "Error",
        description: "Failed to save test type",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "Hematology",
    "Chemistry",
    "Urinalysis",
    "Endocrinology",
    "Microbiology",
    "Immunology",
    "Pathology",
    "Radiology",
  ];

  const sampleTypes = [
    "Blood",
    "Urine",
    "Stool",
    "Saliva",
    "Sputum",
    "CSF",
    "Tissue",
    "Swab",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {testType ? "Edit Test Type" : "Add New Test Type"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Test Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="code">Test Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sample_type">Sample Type *</Label>
              <Select
                value={formData.sample_type}
                onValueChange={(value) => setFormData({ ...formData, sample_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sample type" />
                </SelectTrigger>
                <SelectContent>
                  {sampleTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Label htmlFor="turnaround_time">Turnaround Time (hours) *</Label>
              <Input
                id="turnaround_time"
                type="number"
                min="1"
                value={formData.turnaround_time_hours}
                onChange={(e) => setFormData({ ...formData, turnaround_time_hours: parseInt(e.target.value) || 24 })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="normal_range">Normal Range</Label>
              <Input
                id="normal_range"
                value={formData.normal_range}
                onChange={(e) => setFormData({ ...formData, normal_range: e.target.value })}
                placeholder="e.g., 3.5-5.5"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g., mg/dL, mmol/L"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the test"
            />
          </div>

          <div>
            <Label htmlFor="preparation_instructions">Preparation Instructions</Label>
            <Textarea
              id="preparation_instructions"
              value={formData.preparation_instructions}
              onChange={(e) => setFormData({ ...formData, preparation_instructions: e.target.value })}
              placeholder="Instructions for patient preparation"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : testType ? "Update Test Type" : "Create Test Type"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};