import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Base } from '@prisma/client';

// Define the shape of our store
interface SelectedBaseStore {
  // State
  selectedBase: Base | null;
  
  // Actions
  setSelectedBase: (base: Base | null) => void;
  clearSelectedBase: () => void;
  
  // Computed values (getters)
  hasSelectedBase: () => boolean;
  getSelectedBaseName: () => string;
}

// Create the store using Zustand
export const useSelectedBaseStore = create<SelectedBaseStore>()(
  // Wrap with persist middleware to save to localStorage
  persist(
    (set, get) => ({
      // Initial state
      selectedBase: null,
      
      // Actions
      setSelectedBase: (base) => {
        console.log('Setting selected base:', base?.name);
        set({ selectedBase: base });
      },
      
      clearSelectedBase: () => {
        console.log('Clearing selected base');
        set({ selectedBase: null });
      },
      
      // Computed values
      hasSelectedBase: () => {
        const { selectedBase } = get();
        return selectedBase !== null;
      },
      
      getSelectedBaseName: () => {
        const { selectedBase } = get();
        return selectedBase?.name ?? 'No base selected';
      },
    }),
    {
      name: 'selected-base-storage', // localStorage key
      // Only persist the selectedBase, not the functions
      partialize: (state) => ({ selectedBase: state.selectedBase }),
    }
  )
);

// Export types for TypeScript
export type { SelectedBaseStore };
