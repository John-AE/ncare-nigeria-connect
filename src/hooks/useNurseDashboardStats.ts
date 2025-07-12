import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NurseDashboardStats {
  totalPatients: number;
  totalPendingBills: number;
  newPatientsToday: number;
  todaysAppointments: number;
}

export const useNurseDashboardStats = () => {
  const [stats, setStats] = useState<NurseDashboardStats>({
    totalPatients: 0,
    totalPendingBills: 0,
    newPatientsToday: 0,
    todaysAppointments: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get total patients
        const { count: patientCount } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true });
        
        // Get new patients registered today
        const { count: newPatientsCount } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lt('created_at', `${today}T23:59:59.999Z`);
        
        // Get today's appointments
        const { count: todaysAppointmentsCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('scheduled_date', today);
        
        // Get total pending bills
        const { count: billCount } = await supabase
          .from('bills')
          .select('*', { count: 'exact', head: true })
          .eq('is_paid', false);
        
        setStats({
          totalPatients: patientCount || 0,
          totalPendingBills: billCount || 0,
          newPatientsToday: newPatientsCount || 0,
          todaysAppointments: todaysAppointmentsCount || 0,
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
        (payload) => {
          console.log('Patient real-time INSERT received:', payload);
          const today = new Date().toISOString().split('T')[0];
          const createdToday = payload.new.created_at?.startsWith(today);
          
          setStats(prev => {
            console.log('Updating stats - before:', prev);
            const newStats = {
              ...prev,
              totalPatients: prev.totalPatients + 1,
              newPatientsToday: createdToday ? prev.newPatientsToday + 1 : prev.newPatientsToday
            };
            console.log('Updating stats - after:', newStats);
            return newStats;
          });
        }
      )
      .subscribe();

    const appointmentsChannel = supabase
      .channel('appointments-changes-nurse')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'appointments' },
        (payload) => {
          const today = new Date().toISOString().split('T')[0];
          const scheduledToday = payload.new.scheduled_date === today;
          
          if (scheduledToday) {
            setStats(prev => ({ ...prev, todaysAppointments: prev.todaysAppointments + 1 }));
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'appointments' },
        (payload) => {
          const today = new Date().toISOString().split('T')[0];
          const oldScheduledToday = payload.old.scheduled_date === today;
          const newScheduledToday = payload.new.scheduled_date === today;
          
          if (oldScheduledToday && !newScheduledToday) {
            setStats(prev => ({ ...prev, todaysAppointments: prev.todaysAppointments - 1 }));
          } else if (!oldScheduledToday && newScheduledToday) {
            setStats(prev => ({ ...prev, todaysAppointments: prev.todaysAppointments + 1 }));
          }
        }
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
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(billsChannel);
    };
  }, []);

  return stats;
};