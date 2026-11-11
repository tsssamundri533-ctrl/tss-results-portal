
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isSidebarLocked: boolean;
  setSidebarLocked: (locked: boolean) => void;
  toggleSidebarLock: () => void;
}

/**
 * UI State Store.
 * Manages global interface parameters like sidebar lock state to ensure 
 * layout synchronization across components.
 */
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarLocked: false,
      setSidebarLocked: (locked) => set({ isSidebarLocked: locked }),
      toggleSidebarLock: () => set((state) => ({ isSidebarLocked: !state.isSidebarLocked })),
    }),
    {
      name: 'tss-ui-storage-v2',
    }
  )
);
