'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/use-auth-store';
import { useExamStore } from '@/store/use-exam-store';
import { getExams, getStaffAssignments } from '@/lib/supabase-service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ChevronRight, Edit3, Loader2, Sparkles, Lock } from 'lucide-react';
import Link from 'next/link';
import { Exam, Assignment } from '@/types';
import { motion } from 'framer-motion';

export default function TeacherMarksOverview() {
  const { user } = useAuthStore();
  const { activeExamId } = useExamStore();
  const [exams, setExams] = useState<Exam[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        setLoading(true);
        const [examsData, assignmentsData] = await Promise.all([
          getExams(),
          getStaffAssignments(user.uid)
        ]);
        setExams(examsData);
        setAssignments(assignmentsData.filter(a => !a.isAttendanceLead));
      } catch (err) {
        console.error('Failed to load exams and assignments from Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const sortedExams = useMemo(() => {
    return [...exams].sort((a, b) => {
      if (a.id === activeExamId) return -1;
      if (b.id === activeExamId) return 1;
      return 0;
    });
  }, [exams, activeExamId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.3em]">Loading Academic Workload...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-24 px-4 sm:px-0">
      <header className="space-y-1 mt-4 sm:mt-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit uppercase">Marks Entry</h1>
        <p className="text-[11px] sm:text-sm text-muted-foreground font-medium">Record academic performance for your assigned classes.</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-primary-600" /></div>
      ) : !assignments?.length ? (
        <Card className="border-dashed border-2 bg-transparent text-center p-10 sm:p-16 rounded-[2rem] sm:rounded-[2.5rem] dark:border-white/10">
          <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-slate-200 dark:text-slate-800 mx-auto mb-6" />
          <h3 className="text-lg sm:text-xl font-bold text-slate-500 dark:text-slate-400">No active assignments</h3>
          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-600 mt-2 max-w-xs mx-auto">Contact administrator to assign classes and subjects to your profile.</p>
        </Card>
      ) : (
        <div className="space-y-10 sm:space-y-12">
          {exams?.filter(e => !e.isLocked).map((exam) => {
            const relevantAssignments = assignments.filter(assignment => {
              const hasClassConfig = exam.classConfigs && exam.classConfigs[assignment.className];
              const hasSubject = hasClassConfig && hasClassConfig.subjects[assignment.subjectId];
              return hasClassConfig && hasSubject;
            });

            if (relevantAssignments.length === 0) return null;

            return (
              <div key={exam.id} className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3 px-1 flex-wrap">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-lg sm:text-xl font-bold font-outfit text-navy-900 dark:text-white uppercase tracking-tight">{exam.title}</h2>
                  {exam.id === activeExamId && (
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold text-[9px] uppercase px-2 py-0.5 rounded-md gap-1">
                      <Sparkles className="h-2.5 w-2.5" /> Active Term
                    </Badge>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {relevantAssignments.map((assignment, idx) => (
                    <motion.div
                      key={`${exam.id}-${assignment.id}`}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="border-none shadow-sm rounded-2xl sm:rounded-3xl overflow-hidden group hover:shadow-hover-shadow transition-all bg-white dark:bg-card border dark:border-white/5">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-6">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 flex items-center justify-center border dark:border-white/5">
                              <Edit3 className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <Badge className="bg-slate-50 dark:bg-navy-950 text-slate-500 dark:text-slate-400 border-none font-black text-[8px] sm:text-[9px] uppercase h-5 sm:h-6 px-2">
                              {assignment.className}
                            </Badge>
                          </div>
                          
                          <h3 className="text-lg sm:text-xl font-bold text-navy-900 dark:text-white mb-6 font-outfit line-clamp-1 uppercase">{assignment.subject}</h3>
                          
                          <Button asChild className="w-full rounded-xl sm:rounded-2xl bg-navy-900 dark:bg-primary-600 hover:bg-navy-800 dark:hover:bg-primary-700 shadow-xl h-11 sm:h-12 gap-2 text-white font-black uppercase text-[10px] sm:text-xs">
                            <Link href={`/teacher/marks/${exam.id}/${assignment.subjectId}?class=${assignment.className}`}>
                              Start Recording
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {exams?.some(e => e.isLocked) && (
            <div className="pt-8 border-t border-slate-100 dark:border-white/5 space-y-6">
              <h2 className="text-base sm:text-lg font-bold font-outfit text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Locked Assessments</h2>
              <div className="opacity-50 pointer-events-none grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                 {exams.filter(e => e.isLocked).map(exam => (
                    <Card key={exam.id} className="border-none shadow-none bg-slate-50 dark:bg-white/5 rounded-2xl p-6">
                      <p className="text-sm font-bold text-slate-400 dark:text-slate-300 truncate">{exam.title}</p>
                      <p className="text-[9px] uppercase font-black tracking-widest mt-1 text-slate-500">Status: Finalized</p>
                    </Card>
                 ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
