'use client';

import React, { use, useMemo, useState, useEffect, Suspense } from 'react';
import { useAuthStore } from '@/store/use-auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, Loader2, CircleAlert, CalendarX } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Exam, Student, Mark, Attendance } from '@/types';
import { MarksTable } from '@/components/marks/MarksTable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { getExamById, getStudents, getMarks } from '@/lib/supabase-service';

function TeacherMarksEntryWorkspaceContent({ params }: { params: Promise<{ examId: string, subjectId: string }> }) {
  const { examId, subjectId } = use(params);
  const searchParams = useSearchParams();
  const classId = searchParams.get('class');
  const { schoolId } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [sessionTime, setSessionTime] = useState('');
  const [loading, setLoading] = useState(true);

  const [exam, setExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [marksData, setMarksData] = useState<Mark[]>([]);

  useEffect(() => {
    setMounted(true);
    setSessionTime(new Date().toLocaleTimeString());
    const interval = setInterval(() => setSessionTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadWorkspace() {
      if (!examId || !subjectId || !classId) return;
      try {
        setLoading(true);
        const [examData, studentsList, existingMarks] = await Promise.all([
          getExamById(examId),
          getStudents(classId),
          getMarks(examId, classId, subjectId)
        ]);
        setExam(examData);
        setStudents(studentsList.filter(s => s.status === 'active'));
        setMarksData(existingMarks);
      } catch (err) {
        console.error('Failed to load marks workspace from Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkspace();
  }, [examId, subjectId, classId]);

  // Subject configuration from exam classConfigs
  const subject = (classId && exam?.classConfigs?.[classId]) 
    ? exam.classConfigs[classId].subjects[subjectId] 
    : null;

  const sortedStudents = useMemo(() => {
    if (!students) return [];
    return [...students].sort((a, b) => parseInt(a.rollNumber) - parseInt(b.rollNumber));
  }, [students]);

  const stats = useMemo(() => {
    if (!students || !marksData) return { count: 0, percentage: 0, absentCount: 0 };
    const count = marksData.length;
    const percentage = Math.round((count / (students.length || 1)) * 100);
    return { count, percentage, absentCount: 0 };
  }, [students, marksData]);

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Opening Workload...</p>
      </div>
    );
  }

  if (!exam || !subject || !classId) return <div className="text-center py-24 dark:text-white font-bold">Error loading worksheet parameters.</div>;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-32 px-4 sm:px-0">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 dark:border-white/5 mt-4 sm:mt-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full bg-white dark:bg-card shadow-sm border dark:border-white/5 shrink-0" asChild>
            <Link href="/teacher/marks">
              <ChevronLeft className="h-5 w-5 dark:text-white" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit uppercase">
                {subject.name || subjectId}
              </h1>
              <Badge variant="outline" className="border-primary-600/30 text-primary-600 font-bold text-[10px] uppercase">
                Grade {classId}
              </Badge>
              {exam.isLocked && (
                <Badge variant="destructive" className="font-bold text-[10px] uppercase">
                  Locked
                </Badge>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-1">
              {exam.title} • Max Marks: {subject.maxMarks || 100} • Live Time: {sessionTime}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Completion</p>
            <p className="text-lg font-bold font-outfit text-primary-600">{stats.count} / {students.length} Recorded</p>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="space-y-2 bg-white dark:bg-card p-4 rounded-2xl shadow-sm border dark:border-white/5">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-slate-500">Evaluation Progress</span>
          <span className="text-primary-600">{stats.percentage}%</span>
        </div>
        <Progress value={stats.percentage} className="h-2" />
      </div>

      {exam.isLocked && (
        <Alert variant="destructive" className="rounded-2xl">
          <CircleAlert className="h-4 w-4" />
          <AlertDescription className="text-xs font-semibold">
            This examination cycle is currently locked by the administrator. Marks can only be viewed in read-only mode.
          </AlertDescription>
        </Alert>
      )}

      {/* Primary Marks Table */}
      <MarksTable
        students={sortedStudents}
        marks={marksData}
        examId={examId}
        subjectId={subjectId}
        classId={classId}
        maxMarks={subject.maxMarks || 100}
        subjectName={subject.name || subjectId}
        schoolId={schoolId || 'tss-main-school'}
        isLocked={exam.isLocked}
      />
    </div>
  );
}

export default function TeacherMarksEntryWorkspace({ params }: { params: Promise<{ examId: string, subjectId: string }> }) {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    }>
      <TeacherMarksEntryWorkspaceContent params={params} />
    </Suspense>
  );
}
