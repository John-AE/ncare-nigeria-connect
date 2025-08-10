/**
 * Unified Refresh Hook
 * 
 * Handles both old ref-based refresh pattern and new function-based pattern
 * for backward compatibility during the refactoring process.
 * 
 * @author NCare Nigeria Development Team
 */

import { useEffect } from 'react';

type RefreshTrigger = React.MutableRefObject<(() => void) | null> | ((fn: () => void) => void);

/**
 * Handles both old and new refresh trigger patterns
 * @param refreshTrigger - Either a ref or a function to register refresh
 * @param refreshFunction - The function to call when refresh is triggered
 */
export const useUnifiedRefresh = (
  refreshTrigger: RefreshTrigger | undefined,
  refreshFunction: () => void
) => {
  useEffect(() => {
    if (!refreshTrigger) return;

    if (typeof refreshTrigger === 'function') {
      // New pattern: register function
      refreshTrigger(refreshFunction);
    } else {
      // Old pattern: assign to ref
      refreshTrigger.current = refreshFunction;
    }
  }, [refreshTrigger, refreshFunction]);
};