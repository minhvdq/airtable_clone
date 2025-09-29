"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TableNavigationState {
  currentTableId: string | null
  currentViewId: string | null
  currentBaseId: string | null
  setCurrentTable: (tableId: string) => void
  setCurrentView: (viewId: string) => void
  setCurrentBase: (baseId: string) => void
  setNavigation: (tableId: string, viewId: string, baseId: string) => void
}

export const useTableNavigationStore = create<TableNavigationState>()(
  persist(
    (set) => ({
      currentTableId: null,
      currentViewId: null,
      currentBaseId: null,
      setCurrentTable: (tableId: string) => set({ currentTableId: tableId }),
      setCurrentView: (viewId: string) => set({ currentViewId: viewId }),
      setCurrentBase: (baseId: string) => set({ currentBaseId: baseId }),
      setNavigation: (tableId: string, viewId: string, baseId: string) => 
        set({ currentTableId: tableId, currentViewId: viewId, currentBaseId: baseId }),
    }),
    {
      name: 'table-navigation-storage',
      partialize: (state) => ({
        currentTableId: state.currentTableId,
        currentViewId: state.currentViewId,
        currentBaseId: state.currentBaseId,
      }),
    }
  )
)
