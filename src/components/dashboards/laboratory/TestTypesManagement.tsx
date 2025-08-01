import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, TestTube, Trash2 } from "lucide-react";
import { TestTypeDialog } from "./TestTypeDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const TestTypesManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedTestType, setSelectedTestType] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [testTypeToDelete, setTestTypeToDelete] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: testTypes, isLoading } = useQuery({
    queryKey: ["lab-test-types", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("lab_test_types")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const groupedTests = testTypes?.reduce((acc, test) => {
    if (!acc[test.category]) {
      acc[test.category] = [];
    }
    acc[test.category].push(test);
    return acc;
  }, {} as Record<string, typeof testTypes>) || {};

  const getCategoryColor = (category: string) => {
    const colors = {
      "Hematology": "bg-red-100 text-red-800",
      "Chemistry": "bg-blue-100 text-blue-800",
      "Urinalysis": "bg-yellow-100 text-yellow-800",
      "Endocrinology": "bg-purple-100 text-purple-800",
      "Microbiology": "bg-green-100 text-green-800",
      "Immunology": "bg-pink-100 text-pink-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const handleAddTestType = () => {
    setSelectedTestType(null);
    setShowDialog(true);
  };

  const handleEditTestType = (testType) => {
    setSelectedTestType(testType);
    setShowDialog(true);
  };

  const handleDeleteTestType = (testType) => {
    setTestTypeToDelete(testType);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!testTypeToDelete) return;

    try {
      const { error } = await supabase
        .from("lab_test_types")
        .update({ is_active: false })
        .eq("id", testTypeToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test type deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["lab-test-types"] });
    } catch (error) {
      console.error("Error deleting test type:", error);
      toast({
        title: "Error",
        description: "Failed to delete test type",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setTestTypeToDelete(null);
    }
  };

  const handleDialogSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["lab-test-types"] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Types Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Types Management
          </CardTitle>
          <Button size="sm" onClick={handleAddTestType}>
            <Plus className="h-4 w-4 mr-1" />
            Add Test Type
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tests by name, code, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {Object.entries(groupedTests).map(([category, tests]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getCategoryColor(category)}>
                  {category}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ({tests.length} tests)
                </span>
              </div>
              
              <div className="grid gap-3">
                {tests.map((test) => (
                  <div
                    key={test.id}
                    className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{test.name}</h4>
                          <Badge variant="outline">{test.code}</Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium">Sample:</span> {test.sample_type}
                            </div>
                            <div>
                              <span className="font-medium">Price:</span> ₦{Number(test.price).toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">TAT:</span> {test.turnaround_time_hours}h
                            </div>
                            {test.normal_range && (
                              <div>
                                <span className="font-medium">Normal:</span> {test.normal_range} {test.unit}
                              </div>
                            )}
                          </div>
                          
                          {test.preparation_instructions && (
                            <div className="mt-2">
                              <span className="font-medium">Instructions:</span>
                              <p className="text-xs mt-1">{test.preparation_instructions}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditTestType(test)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteTestType(test)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {Object.keys(groupedTests).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No tests found matching your search" : "No test types available"}
            </div>
          )}
        </div>
      </CardContent>

      <TestTypeDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        testType={selectedTestType}
        onSuccess={handleDialogSuccess}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{testTypeToDelete?.name}"? This action will mark the test type as inactive and it won't be available for new orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};