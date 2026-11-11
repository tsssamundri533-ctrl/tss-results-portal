
import { create } from 'zustand';
import { SchoolSettings } from '@/types';

interface SchoolState {
  settings: SchoolSettings | null;
  isLoading: boolean;
  setSettings: (settings: SchoolSettings | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useSchoolStore = create<SchoolState>((set) => ({
  settings: null,
  isLoading: true,
  setSettings: (settings) => set({ settings, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
