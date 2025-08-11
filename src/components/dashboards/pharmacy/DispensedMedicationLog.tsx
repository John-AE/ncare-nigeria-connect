import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Package, Download, FileText, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useUnifiedRefresh } from "@/hooks/useUnifiedRefresh";

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
  refreshTrigger?: (fn: () => void) => void;
}

export const DispensedMedicationLog = ({ refreshTrigger }: DispensedMedicationLogProps) => {
  const [dispensedMedications, setDispensedMedications] = useState<DispensedMedication[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<DispensedMedication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

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

  // Use unified refresh hook
  useUnifiedRefresh(refreshTrigger, fetchDispensedMedications);

  useEffect(() => {
    if (profile?.hospital_id) {
      fetchDispensedMedications();
      
      // Poll every 3 seconds for new dispensed medications
      const interval = setInterval(() => {
        // Don't show loading state on subsequent fetches
        fetchDispensedMedications(false);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [profile?.hospital_id]);

  useEffect(() => {
    filterMedications();
  }, [dispensedMedications, searchTerm]);

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

  const exportToCSV = () => {
    const dataToExport = filteredMedications.map(item => ({
      'Patient Name': item.patient_name,
      'Medication': item.medications.name,
      'Dosage': item.medications.dosage,
      'Form': item.medications.form,
      'Quantity Dispensed': item.quantity_dispensed,
      'Dispensed At': formatDate(item.dispensed_at),
      'Notes': item.notes || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dispensed Medications");
    XLSX.writeFile(wb, `dispensed-medications-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    
    toast({
      title: "Success",
      description: "Dispensed medications exported to Excel successfully",
    });
  };

  const generatePdfReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingPdf(true);
    try {
      // Fetch data for the selected date range
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
        .gte('dispensed_at', format(startDate, 'yyyy-MM-dd'))
        .lte('dispensed_at', format(endDate, 'yyyy-MM-dd'))
        .order('dispensed_at', { ascending: false });

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

      // Generate PDF
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Dispensed Medication Log Report', 20, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Period: ${format(startDate, 'MMMM dd, yyyy')} - ${format(endDate, 'MMMM dd, yyyy')}`, 20, 35);
      doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, 20, 45);

      // Summary
      const totalDispensed = formattedData.length;
      const uniqueMedications = new Set(formattedData.map(item => item.medications.name)).size;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 20, 65);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Medications Dispensed: ${totalDispensed}`, 20, 80);
      doc.text(`Unique Medications: ${uniqueMedications}`, 20, 90);

      // Table
      if (formattedData.length > 0) {
        const tableData = formattedData.map(item => [
          item.patient_name,
          item.medications.name,
          item.medications.dosage,
          item.medications.form,
          item.quantity_dispensed.toString(),
          formatDate(item.dispensed_at),
          item.notes || 'N/A'
        ]);

        autoTable(doc, {
          head: [['Patient', 'Medication', 'Dosage', 'Form', 'Quantity', 'Date/Time', 'Notes']],
          body: tableData,
          startY: 110,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [34, 197, 94] },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 30 },
            2: { cellWidth: 20 },
            3: { cellWidth: 15 },
            4: { cellWidth: 15 },
            5: { cellWidth: 30 },
            6: { cellWidth: 25 }
          }
        });
      } else {
        doc.text('No medications dispensed in the selected period.', 20, 120);
      }

      // Save PDF
      doc.save(`dispensed-medications-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "Success",
        description: "PDF report generated successfully",
      });
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPdf(false);
    }
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
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            onClick={exportToCSV}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "MMM dd") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "MMM dd") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button
              onClick={generatePdfReport}
              disabled={isGeneratingPdf || !startDate || !endDate}
              size="sm"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {isGeneratingPdf ? "Generating..." : "PDF Report"}
            </Button>
          </div>
        </div>
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