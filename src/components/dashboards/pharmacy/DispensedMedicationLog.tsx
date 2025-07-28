import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface DispensedMedication {
  id: string;
  patient_name: string;
  medications: {
    name: string;
    dosage: string;
    form: string;
  };
  quantity_dispensed: number;
  dispensed_at: string;
  notes?: string;
}

interface DispensedMedicationLogProps {
  refreshTrigger?: React.MutableRefObject<(() => void) | null>;
}

export const DispensedMedicationLog = ({ refreshTrigger }: DispensedMedicationLogProps) => {
  const [dispensedMedications, setDispensedMedications] = useState<DispensedMedication[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<DispensedMedication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.hospital_id) {
      fetchDispensedMedications();
      
      // Set up refresh trigger if provided
      if (refreshTrigger) {
        refreshTrigger.current = fetchDispensedMedications;
      }
      
      // Poll every 3 seconds for new dispensed medications
      const interval = setInterval(() => {
        // Don't show loading state on subsequent fetches
        fetchDispensedMedications(false);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [profile?.hospital_id, refreshTrigger]);

  useEffect(() => {
    filterMedications();
  }, [dispensedMedications, searchTerm]);

  const fetchDispensedMedications = async (showLoading = true) => {
    try {
      // Only show loading state on initial load
      if (showLoading && initialLoading) {
        setInitialLoading(true);
      }

      const { data, error } = await supabase
        .from('medication_dispensing')
        .select(`
          id,
          quantity_dispensed,
          dispensed_at,
          notes,
          patients!inner(first_name, last_name),
          medications!inner(name, dosage, form)
        `)
        .eq('hospital_id', profile?.hospital_id)
        .order('dispensed_at', { ascending: false })
        .limit(10); // Limit to 10 as requested

      if (error) throw error;

      const formattedData: DispensedMedication[] = data?.map(item => ({
        id: item.id,
        patient_name: `${item.patients.first_name} ${item.patients.last_name}`,
        medications: {
          name: item.medications.name,
          dosage: item.medications.dosage,
          form: item.medications.form
        },
        quantity_dispensed: item.quantity_dispensed,
        dispensed_at: item.dispensed_at,
        notes: item.notes
      })) || [];

      setDispensedMedications(formattedData);
    } catch (error) {
      console.error('Error fetching dispensed medications:', error);
    } finally {
      // Only set initial loading to false once
      if (initialLoading) {
        setInitialLoading(false);
      }
    }
  };

  const filterMedications = () => {
    if (!searchTerm.trim()) {
      setFilteredMedications(dispensedMedications.slice(0, 3)); // Show max 3 items when not searching
      return;
    }

    const filtered = dispensedMedications.filter(item =>
      item.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.medications.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredMedications(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Only show loading state on initial load
  if (initialLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Dispensed Medication Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading dispensed medications...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Dispensed Medication Log
          <Badge variant="outline" className="ml-auto">
            {dispensedMedications.length} recent
          </Badge>
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by patient name or medication..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredMedications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No medications found for this search' : 'No medications dispensed recently'}
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {filteredMedications.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-all duration-200 hover:scale-[1.01] hover:shadow-sm"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{item.patient_name}</p>
                      <Badge variant="outline" className="text-xs">
                        {formatDate(item.dispensed_at)}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">{item.medications.name}</span> - {item.medications.dosage}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Form: {item.medications.form} • Quantity: {item.quantity_dispensed}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground italic">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {!searchTerm && dispensedMedications.length > 3 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Showing latest 3 of {dispensedMedications.length} dispensed medications. Use search to find specific records.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};