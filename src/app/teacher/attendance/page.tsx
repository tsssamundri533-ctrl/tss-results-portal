'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  CalendarCheck, 
  QrCode, 
  Loader2,
  AlertCircle,
  CalendarDays,
  ShieldCheck,
  Zap,
  RefreshCcw,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/use-auth-store';
import { Exam, Assignment } from '@/types';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { getStaffAssignments, getExams } from '@/lib/supabase-service';

export default function TeacherAttendanceOverview() {
  const { user } = useAuthStore();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [assignmentsList, examsList] = await Promise.all([
        getStaffAssignments(user.uid),
        getExams()
      ]);
      setAssignments(assignmentsList.filter(a => a.dutyDate === today && a.isAttendanceLead));
      setExams(examsList.filter(e => !e.isLocked));
    } catch (err) {
      console.error('Failed to load teacher attendance duties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Verifying Proctor Roster...</p>
      </div>
    );
  }

  const activeExam = exams[0] || null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32 px-4 sm:px-0">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-navy-900 dark:text-white font-outfit">
              Proctoring Duty
            </h1>
            <Badge className="bg-primary-600/10 text-primary-600 border-none font-bold text-[10px] uppercase">
              {today}
            </Badge>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Sign in and record student attendance for your assigned examination halls.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadData} className="rounded-full text-xs font-bold gap-1.5 self-start sm:self-auto">
          <RefreshCcw className="h-3.5 w-3.5" />
          Refresh Duties
        </Button>
      </header>

      {assignments.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200 dark:border-white/5 bg-transparent p-12 text-center rounded-[2.5rem]">
          <CalendarDays className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="font-bold text-lg font-outfit text-navy-900 dark:text-white">No Proctoring Duty Today</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            You do not have any proctoring duties assigned for {today}. Check with the examination controller if you are scheduled.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map(duty => (
            <Card key={duty.id} className="border-none shadow-card rounded-3xl bg-white dark:bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <Badge variant="secondary" className="font-bold text-xs uppercase mb-2">
                  Grade {duty.className}
                </Badge>
                <h3 className="text-lg font-bold font-outfit text-navy-900 dark:text-white">
                  {activeExam ? activeExam.title : 'Active Examination'}
                </h3>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  Assigned Hall Proctor: {duty.teacherName}
                </p>
              </div>

              {activeExam && (
                <div className="flex items-center gap-3">
                  <Button className="rounded-2xl bg-navy-900 dark:bg-primary-600 text-white font-bold text-xs h-11 px-5 gap-2" asChild>
                    <Link href={`/teacher/attendance/${activeExam.id}/scan?class=${encodeURIComponent(duty.className)}`}>
                      <QrCode className="h-4 w-4" />
                      Scan QR
                    </Link>
                  </Button>
                  <Button variant="outline" className="rounded-2xl border-slate-200 dark:border-white/10 font-bold text-xs h-11 px-5" asChild>
                    <Link href={`/teacher/attendance/${activeExam.id}/${today}?class=${encodeURIComponent(duty.className)}`}>
                      Manual List
                    </Link>
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
