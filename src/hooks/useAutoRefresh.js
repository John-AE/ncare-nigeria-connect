import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAutoRefresh = () => {
  useEffect(() => {
    const channel = supabase
      .channel('global-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vital_signs' }, () => {
        setTimeout(() => window.location.reload(), 500);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        setTimeout(() => window.location.reload(), 500);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        setTimeout(() => window.location.reload(), 500);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);
};
