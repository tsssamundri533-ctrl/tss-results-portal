'use client';

import React, { use, useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  Loader2, 
  Info,
  CalendarX,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { MarksTable } from '@/components/marks/MarksTable';
import { Exam, Student, Mark } from '@/types';
import { motion } from 'framer-motion';
import { getExamById, getStudents, getMarks } from '@/lib/supabase-service';

function SubjectMarksContent({ params }: { params: Promise<{ examId: string, subjectId: string }> }) {
  const { examId, subjectId } = use(params);
  const searchParams = useSearchParams();
  const classId = searchParams.get('class');
  const { schoolId } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [sessionTime, setSessionTime] = useState('');

  const [exam, setExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [marksData, setMarksData] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    setSessionTime(new Date().toLocaleTimeString());
    const interval = setInterval(() => setSessionTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!classId) return;

    async function loadData() {
      try {
        setLoading(true);
        const [exData, stData, mData] = await Promise.all([
          getExamById(examId),
          getStudents(classId || undefined),
          getMarks(examId, classId || undefined, undefined, subjectId)
        ]);
        setExam(exData);
        setStudents(stData);
        setMarksData(mData);
      } catch (err) {
        console.error('Error loading subject marks page:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [examId, subjectId, classId]);

  const subject = (classId && exam?.classConfigs?.[classId]) 
    ? exam.classConfigs[classId].subjects[subjectId] 
    : null;

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => parseInt(a.rollNumber) - parseInt(b.rollNumber));
  }, [students]);

  const stats = useMemo(() => {
    if (!students || !marksData || !subject) return { count: 0, percentage: 0, avg: 0, passCount: 0 };
    
    const count = marksData.length;
    const percentage = Math.round((count / (students.length || 1)) * 100);
    const sum = marksData.reduce((acc, m) => acc + (m.marks || 0), 0);
    const avg = count > 0 ? (sum / count).toFixed(1) : 0;
    const passCount = marksData.filter(m => ((m.marks || 0) / (subject?.maxMarks || 100)) * 100 >= (exam?.passPercentage || 33)).length;
    
    return { count, percentage, avg, passCount };
  }, [students, marksData, subject, exam]);

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Opening Registry Ledger from Supabase...</p>
      </div>
    );
  }

  if (!exam || !subject || !classId) {
    return (
      <div className="text-center py-24 font-bold text-rose-500">
        CONFIGURATION ERROR: SHEET PARAMETERS MISSING
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-40 font-inter px-4 sm:px-0">
      <header className="sticky top-16 z-30 bg-background/95 backdrop-blur-md pt-6 pb-4 border-b border-border transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-card border border-border shadow-sm text-foreground" asChild>
              <Link href={`/admin/marks/${examId}`}><ChevronLeft className="h-6 w-6" /></Link>
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-primary-600 font-black text-[10px] uppercase h-5 px-3 text-white border-none">
                  Class: {classId}
                </Badge>
                <Badge variant="outline" className="bg-card border-border text-foreground font-bold text-[10px] uppercase h-5 px-3">
                  Subject: {subject.name}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-outfit leading-tight">
                {exam.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest bg-muted px-4 py-2 rounded-full border border-border shadow-sm">
              Live Session: {sessionTime}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-card text-card-foreground p-8 rounded-[2.5rem] shadow-sm border border-border relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Sheet Completion</p>
                  <h3 className="text-2xl font-black font-outfit text-foreground">{stats.count} / {students.length} Records Entered</h3>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 font-bold text-[10px] uppercase">
                    {stats.percentage === 100 ? 'Finalized' : 'In Progress'}
                  </Badge>
               </div>
            </div>
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden mb-3">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${stats.percentage}%` }}
                 transition={{ duration: 1, ease: "easeOut" }}
                 className="h-full bg-primary-600"
               />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
              <Info className="h-3.5 w-3.5 text-primary-600" />
              Auto-saved directly to Supabase cloud database with instant debounced sync.
            </div>
          </div>
        </div>
      </header>

      <div>
        <MarksTable 
          students={sortedStudents}
          marks={marksData}
          examId={examId}
          subjectId={subjectId}
          classId={classId}
          maxMarks={subject.maxMarks}
          subjectName={subject.name}
          schoolId="tss-main-school"
          isLocked={exam.isLocked}
        />
      </div>

      <footer className="fixed bottom-0 left-0 right-0 md:left-[260px] bg-background/95 backdrop-blur-xl border-t border-border p-5 px-10 z-40 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-around sm:justify-end gap-8 sm:gap-16">
          <div className="text-center sm:text-right">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Total Enrolled</p>
            <p className="text-2xl font-black font-outfit text-foreground">{students.length}</p>
          </div>
          <div className="hidden sm:block h-10 w-px bg-border" />
          <div className="text-center sm:text-right">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Pass Ratio</p>
            <div className="flex items-center gap-1 justify-center sm:justify-end">
               <p className="text-2xl font-black font-outfit text-emerald-600 dark:text-emerald-400">{stats.passCount}</p>
               <span className="text-xs font-bold text-muted-foreground">/ {stats.count}</span>
            </div>
          </div>
          <div className="hidden sm:block h-10 w-px bg-border" />
          <div className="text-center sm:text-right">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Class Average</p>
            <p className="text-2xl font-black font-outfit text-primary-600 dark:text-primary-400 tabular-nums">{stats.avg}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function SubjectMarksPage({ params }: { params: Promise<{ examId: string, subjectId: string }> }) {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    }>
      <SubjectMarksContent params={params} />
    </Suspense>
  );
}
