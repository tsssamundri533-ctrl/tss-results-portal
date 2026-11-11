'use client';

import { create } from 'zustand';

export type AppUserRole = 'admin' | 'teacher' | 'coordinator' | null;

interface AuthState {
  user: any | null;
  role: AppUserRole;
  schoolId: string;
  userName: string | null;
  userPhotoURL: string | null;
  isLoading: boolean;
  setAuth: (user: any | null, role: AppUserRole, schoolId: string, profile?: { name?: string, photoURL?: string }) => void;
  setLoading: (isLoading: boolean) => void;
  clearAuth: () => void;
}

// Fixed identifier for TSSS single-school deployment
export const FIXED_SCHOOL_ID = 'tss-main-school';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  schoolId: FIXED_SCHOOL_ID,
  userName: null,
  userPhotoURL: null,
  isLoading: true,
  setAuth: (user, role, schoolId, profile) => set({ 
    user, 
    role, 
    schoolId: FIXED_SCHOOL_ID, 
    userName: profile?.name || user?.user_metadata?.name || user?.displayName || user?.email?.split('@')[0] || 'User',
    userPhotoURL: profile?.photoURL || user?.user_metadata?.photoURL || user?.photoURL || null,
    isLoading: false 
  }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => set({ 
    user: null, 
    role: null, 
    schoolId: FIXED_SCHOOL_ID, 
    userName: null,
    userPhotoURL: null,
    isLoading: false 
  }),
}));
