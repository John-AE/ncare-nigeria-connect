/**
 * Modal State Management Hook
 * 
 * Centralized state management for modal dialogs to reduce code duplication
 * across dashboard components. Provides consistent modal state handling patterns.
 * 
 * @author NCare Nigeria Development Team
 */

import { useState, useCallback } from 'react';

export interface ModalState {
  [key: string]: boolean;
}

/**
 * Hook for managing multiple modal states
 * @param initialState - Initial state object for all modals
 * @returns Modal state management functions
 */
export const useModalState = (initialState: ModalState = {}) => {
  const [modals, setModals] = useState<ModalState>(initialState);

  const openModal = useCallback((modalName: string) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  }, []);

  const closeModal = useCallback((modalName: string) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals(prev => 
      Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {})
    );
  }, []);

  const isModalOpen = useCallback((modalName: string) => {
    return Boolean(modals[modalName]);
  }, [modals]);

  return {
    modals,
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen
  };
};