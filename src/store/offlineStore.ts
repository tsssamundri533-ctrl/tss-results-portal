
import { create } from 'zustand';

type SyncStatus = 'saved' | 'saving' | 'queued' | 'syncing';

interface OfflineState {
  syncStatus: SyncStatus;
  pendingCount: number;
  setSyncStatus: (status: SyncStatus) => void;
  incrementPending: () => void;
  decrementPending: () => void;
  setPendingCount: (count: number) => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  syncStatus: 'saved',
  pendingCount: 0,
  setSyncStatus: (status) => set({ syncStatus: status }),
  incrementPending: () => set((state) => ({ pendingCount: state.pendingCount + 1 })),
  decrementPending: () => set((state) => ({ pendingCount: Math.max(0, state.pendingCount - 1) })),
  setPendingCount: (count) => set({ pendingCount: count }),
}));
