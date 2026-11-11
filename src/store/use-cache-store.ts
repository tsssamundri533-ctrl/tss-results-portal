
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Institutional Flash Cache Store.
 * Stores the last known state of Firestore collections and documents in memory/localStorage.
 * Enables zero-latency "instant hydration" while real-time listeners connect.
 */
interface CacheState {
  collections: Record<string, any[]>;
  documents: Record<string, any>;
  setCollectionCache: (path: string, data: any[]) => void;
  setDocumentCache: (path: string, data: any) => void;
  clearCache: () => void;
}

export const useCacheStore = create<CacheState>()(
  persist(
    (set) => ({
      collections: {},
      documents: {},
      
      setCollectionCache: (path, data) => set((state) => ({
        collections: { ...state.collections, [path]: data }
      })),
      
      setDocumentCache: (path, data) => set((state) => ({
        documents: { ...state.documents, [path]: data }
      })),
      
      clearCache: () => set({ collections: {}, documents: {} }),
    }),
    {
      name: 'tss-data-flash-cache-v1',
    }
  )
);
