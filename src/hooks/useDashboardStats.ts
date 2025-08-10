/**
 * Base Dashboard Stats Hook
 * 
 * Provides common patterns for dashboard statistics hooks to reduce code duplication.
 * Includes standardized error handling, loading states, and hospital filtering.
 * 
 * @author NCare Nigeria Development Team
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BaseDashboardStats {
  [key: string]: number | string | boolean;
}

/**
 * Base hook for dashboard statistics with common patterns
 * @param fetchFunction - Function that fetches the stats data
 * @param dependencies - Dependencies for useEffect
 * @returns Stats data, loading state, error state, and refetch function
 */
export const useDashboardStats = <T extends BaseDashboardStats>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [stats, setStats] = useState<T>({} as T);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, dependencies);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};

/**
 * Gets the current user's hospital ID for filtering data
 * @returns Hospital ID or null
 */
export const getCurrentUserHospitalId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('hospital_id')
      .eq('user_id', user.id)
      .single();

    return profileData?.hospital_id || null;
  } catch (error) {
    console.error('Error getting user hospital ID:', error);
    return null;
  }
};

/**
 * Gets today's date in ISO format for date queries
 * @returns Today's date string (YYYY-MM-DD)
 */
export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Gets date range for month queries
 * @returns Object with start and end dates for current month
 */
export const getCurrentMonthRange = () => {
  const currentMonth = new Date();
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  return {
    start: startOfMonth.toISOString(),
    end: endOfMonth.toISOString()
  };
};