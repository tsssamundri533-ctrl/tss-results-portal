import { create } from 'zustand';

interface AppState {
  schoolId: string | null;
  userRole: 'admin' | 'teacher' | null;
  setSchoolId: (id: string | null) => void;
  setUserRole: (role: 'admin' | 'teacher' | null) => void;
}

export const useStore = create<AppState>((set) => ({
  schoolId: null,
  userRole: null,
  setSchoolId: (id) => set({ schoolId: id }),
  setUserRole: (role) => set({ userRole: role }),
}));
