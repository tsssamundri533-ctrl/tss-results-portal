'use client';

import { use, useMemo, useState, useEffect, Suspense } from 'react';
import { 
  ChevronLeft, 
  Search, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  CalendarDays, 
  Users, 
  ShieldCheck, 
  Zap, 
  ArrowRight 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/use-auth-store';
import { useSearchParams, useRouter } from 'next/navigation';
import { Student, Attendance } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { getStudents, getExamById } from '@/lib/supabase-service';
import { getAttendanceRecords, saveAttendanceRecord } from '@/lib/attendance-service';

function TeacherManualAttendanceContent({ params }: { params: Promise<{ examId: string, date: string }> }) {
  const { examId, date } = use(params);
  const searchParams = useSearchParams();
  const classId = searchParams.get('class');
  const router = useRouter();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  const targetClass = classId ? decodeURIComponent(classId) : '';

  useEffect(() => {
    async function loadData() {
      if (!targetClass) return;
      try {
        setLoading(true);
        const [studentsList, records] = await Promise.all([
          getStudents(targetClass),
          getAttendanceRecords(examId, date)
        ]);
        setStudents(studentsList.filter(s => s.status === 'active'));
        setAttendanceRecords(records);
      } catch (err) {
        console.error('Failed to load manual attendance data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [targetClass, examId, date]);

  const filteredStudents = useMemo(() => {
    return [...students]
      .filter(s => {
        const matchesClass = s.class === targetClass;
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNumber.includes(searchTerm);
        return matchesClass && matchesSearch;
      })
      .sort((a, b) => parseInt(a.rollNumber) - parseInt(b.rollNumber));
  }, [students, searchTerm, targetClass]);

  const markAttendance = async (student: Student, status: 'present' | 'absent') => {
    const record: Attendance = {
      id: student.id,
      studentId: student.id,
      studentName: student.name,
      className: student.class,
      sectionName: student.section,
      status,
      markedAt: new Date().toISOString(),
      markedBy: user?.email || user?.uid || 'Teacher',
      timestamp: new Date().toISOString()
    };

    await saveAttendanceRecord(examId, date, record);
    setAttendanceRecords(prev => {
      const filtered = prev.filter(r => r.studentId !== student.id);
      return [...filtered, record];
    });
  };

  const getStatus = (studentId: string) => attendanceRecords.find(r => r.studentId === studentId)?.status;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Opening Hall Register...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32 px-4 sm:px-0">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 border-b pb-4 dark:border-white/5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-outfit text-navy-900 dark:text-white">
                Grade {targetClass} Register
              </h1>
              <Badge variant="outline" className="border-primary-600 text-primary-600 font-bold">
                {date}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Direct Proctor Sign-off • {filteredStudents.length} Candidates
            </p>
          </div>
        </div>

        <Button className="rounded-2xl bg-navy-900 dark:bg-primary-600 text-white font-bold text-xs h-10 px-4 gap-2" asChild>
          <Link href={`/teacher/attendance/${examId}/scan?class=${encodeURIComponent(targetClass)}`}>
            <QrCode className="h-4 w-4" />
            Switch to Scanner
          </Link>
        </Button>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Filter by student name or roll number..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9 h-11 rounded-2xl bg-white dark:bg-card border-none shadow-sm"
        />
      </div>

      <div className="space-y-3">
        {filteredStudents.map(student => {
          const status = getStatus(student.id);
          return (
            <Card key={student.id} className="border-none shadow-sm rounded-2xl bg-white dark:bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 rounded-xl shrink-0">
                  <AvatarImage src={student.photoURL} />
                  <AvatarFallback className="font-bold text-xs">{student.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary-600 shrink-0">#{student.rollNumber}</span>
                    <h4 className="font-bold text-sm text-navy-900 dark:text-white truncate">{student.name}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">F: {student.fatherName || 'N/A'} • Sec: {student.section}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5">
                <Button
                  size="sm"
                  variant={status === 'present' ? 'default' : 'outline'}
                  onClick={() => markAttendance(student, 'present')}
                  className={cn(
                    "rounded-xl font-bold text-xs h-10 sm:h-9 px-4 w-full sm:w-auto transition-all active:scale-95",
                    status === 'present' ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30" : "border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Present
                </Button>
                <Button
                  size="sm"
                  variant={status === 'absent' ? 'default' : 'outline'}
                  onClick={() => markAttendance(student, 'absent')}
                  className={cn(
                    "rounded-xl font-bold text-xs h-10 sm:h-9 px-4 w-full sm:w-auto transition-all active:scale-95",
                    status === 'absent' ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30" : "border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400"
                  )}
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Absent
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function TeacherManualAttendance({ params }: { params: Promise<{ examId: string, date: string }> }) {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    }>
      <TeacherManualAttendanceContent params={params} />
    </Suspense>
  );
}
