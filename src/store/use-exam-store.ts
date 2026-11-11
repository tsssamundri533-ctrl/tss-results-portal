import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Exam } from '@/types';

interface ExamStoreState {
  activeExamId: string | null;
  exams: Exam[];
  setActiveExamId: (id: string | null) => void;
  setExams: (exams: Exam[]) => void;
}

/**
 * Global Examination & Term Store
 * Manages the active academic examination cycle (e.g. First Term, Second Term, Final Term)
 * across Admin and Teacher workspaces with persistent synchronization.
 */
export const useExamStore = create<ExamStoreState>()(
  persist(
    (set) => ({
      activeExamId: null,
      exams: [],
      setActiveExamId: (id) => set({ activeExamId: id }),
      setExams: (exams) => set((state) => {
        // Find latest unlocked exam or latest created exam (exams is sorted created_at desc)
        const isCurrentActiveValid = state.activeExamId && exams.some(e => e.id === state.activeExamId);
        const nextActiveId = isCurrentActiveValid
          ? state.activeExamId
          : (exams.find(e => !e.isLocked)?.id || exams[0]?.id || null);
        return { exams, activeExamId: nextActiveId };
      }),
    }),
    {
      name: 'tss-active-exam-v2',
    }
  )
);
