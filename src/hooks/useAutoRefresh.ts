/**
 * Auto Refresh Hook
 * 
 * Provides automatic refresh functionality with configurable intervals.
 * Converts the old JavaScript version to TypeScript with better type safety.
 * 
 * @author NCare Nigeria Development Team
 */

import { useEffect, useRef } from 'react';

/**
 * Hook for automatic refresh functionality
 * @param refreshCallback - Function to call on refresh, defaults to page reload
 * @param intervalMs - Refresh interval in milliseconds, defaults to 30 seconds
 * @param enabled - Whether auto-refresh is enabled, defaults to true
 */
export const useAutoRefresh = (
  refreshCallback?: () => void,
  intervalMs: number = 30000,
  enabled: boolean = true
) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      if (refreshCallback && typeof refreshCallback === 'function') {
        refreshCallback();
      } else {
        // Fallback to page reload - should be avoided in favor of data refetching
        window.location.reload();
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshCallback, intervalMs, enabled]);

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startAutoRefresh = () => {
    if (enabled && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (refreshCallback && typeof refreshCallback === 'function') {
          refreshCallback();
        } else {
          window.location.reload();
        }
      }, intervalMs);
    }
  };

  return {
    stopAutoRefresh,
    startAutoRefresh
  };
};