import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NurseDashboardStats {
  totalPatients: number;
  totalPendingBills: number;
}

export const useNurseDashboardStats = () => {
  const [stats, setStats] = useState<NurseDashboardStats>({
    totalPatients: 0,
    totalPendingBills: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total patients
        const { count: patientCount } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true });
        
        // Get total pending bills
        const { count: billCount } = await supabase
          .from('bills')
          .select('*', { count: 'exact', head: true })
          .eq('is_paid', false);
        
        setStats({
          totalPatients: patientCount || 0,
          totalPendingBills: billCount || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();

    // Set up real-time listeners
    const patientsChannel = supabase
      .channel('patients-changes-nurse')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'patients' },
        () => setStats(prev => ({ ...prev, totalPatients: prev.totalPatients + 1 }))
      )
      .subscribe();

    const billsChannel = supabase
      .channel('bills-changes-nurse')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bills' },
        (payload) => {
          if (!payload.new.is_paid) {
            setStats(prev => ({ ...prev, totalPendingBills: prev.totalPendingBills + 1 }));
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bills' },
        (payload) => {
          const oldRecord = payload.old;
          const newRecord = payload.new;
          
          setStats(prev => {
            let newStats = { ...prev };
            // If bill status changed from unpaid to paid
            if (!oldRecord.is_paid && newRecord.is_paid) {
              newStats.totalPendingBills = prev.totalPendingBills - 1;
            }
            // If bill status changed from paid to unpaid
            else if (oldRecord.is_paid && !newRecord.is_paid) {
              newStats.totalPendingBills = prev.totalPendingBills + 1;
            }
            return newStats;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(patientsChannel);
      supabase.removeChannel(billsChannel);
    };
  }, []);

  return stats;
};