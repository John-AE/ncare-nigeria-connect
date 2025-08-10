/**
 * Refresh Manager Hook
 * 
 * Provides centralized refresh management for dashboard components.
 * Replaces inefficient window.location.reload() with targeted data refetching.
 * 
 * @author NCare Nigeria Development Team
 */

import { useRef, useCallback } from 'react';

export interface RefreshTriggers {
  [key: string]: (() => void) | null;
}

/**
 * Hook for managing component refresh triggers
 * @returns Refresh management functions
 */
export const useRefreshManager = () => {
  const triggers = useRef<RefreshTriggers>({});

  const registerRefresh = useCallback((key: string, callback: () => void) => {
    triggers.current[key] = callback;
  }, []);

  const triggerRefresh = useCallback((key: string) => {
    const refreshFn = triggers.current[key];
    if (refreshFn && typeof refreshFn === 'function') {
      refreshFn();
    }
  }, []);

  const triggerMultipleRefresh = useCallback((keys: string[]) => {
    keys.forEach(key => triggerRefresh(key));
  }, [triggerRefresh]);

  const triggerAllRefresh = useCallback(() => {
    Object.values(triggers.current).forEach(refreshFn => {
      if (refreshFn && typeof refreshFn === 'function') {
        refreshFn();
      }
    });
  }, []);

  return {
    registerRefresh,
    triggerRefresh,
    triggerMultipleRefresh,
    triggerAllRefresh
  };
};