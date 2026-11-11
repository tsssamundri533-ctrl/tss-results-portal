'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  CalendarCheck, 
  FileText, 
  Loader2, 
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Calendar,
  School,
  Users,
  ShieldCheck,
  UserCheck,
  Star,
  Plus,
  QrCode,
  FileDown,
  Edit3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useSchoolStore } from '@/store/use-school-store';
import { Exam, Attendance, Student, Assignment } from '@/types';
import Link from 'next/link';
import { format, startOfToday, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { getExams, getStudents, getStaffAssignments } from '@/lib/supabase-service';
import { getAttendanceRecords } from '@/lib/attendance-service';

export default function AdminAttendanceOverview() {
  const settings = useSchoolStore(state => state.settings);

  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<string | null>(null);

  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [dailyAssignments, setDailyAssignments] = useState<Assignment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    setSelectedDate(format(startOfToday(), 'yyyy-MM-dd'));
  }, []);

  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);
        const [examsList, studentsList, assignmentsList] = await Promise.all([
          getExams(),
          getStudents(),
          getStaffAssignments()
        ]);
        setExams(examsList);
        setStudents(studentsList.filter(s => s.status === 'active'));
        setDailyAssignments(assignmentsList.filter(a => a.isAttendanceLead));
        if (examsList.length > 0) {
          setSelectedExam(examsList[0].id);
        }
      } catch (err) {
        console.error('Failed to load initial attendance data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    async function loadRecords() {
      if (!selectedExam || !selectedDate) return;
      const records = await getAttendanceRecords(selectedExam, selectedDate);
      setAttendanceRecords(records);
    }
    loadRecords();
  }, [selectedExam, selectedDate]);

  const stats = useMemo(() => {
    if (!attendanceRecords || !students) return { present: 0, absent: 0, percentage: 0 };
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const total = students.length || 1;
    return {
      present,
      absent,
      percentage: Math.round((present / total) * 100)
    };
  }, [attendanceRecords, students]);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 px-4 sm:px-0">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit">Attendance Center</h1>
          <p className="text-muted-foreground font-medium">Institutional register oversight for any examination date.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Inquiry Date</span>
              <Input 
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-44 h-11 rounded-2xl bg-white dark:bg-card border-slate-200 dark:border-white/10 font-bold text-xs"
              />
           </div>
           {selectedExam && (
             <Button className="rounded-full shadow-lg h-11 px-5 gap-2 bg-navy-900 dark:bg-primary-600 hover:bg-navy-800 text-white font-bold" asChild>
               <Link href={`/admin/attendance/scan/${selectedExam}`}>
                 <QrCode className="h-4 w-4" />
                 Launch Scanner
               </Link>
             </Button>
           )}
        </div>
      </header>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-card p-6">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Enrolled</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold font-outfit text-navy-900 dark:text-white">{students.length}</h3>
            <Users className="h-6 w-6 text-slate-400" />
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-card p-6">
          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Present Count</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold font-outfit text-emerald-600">{stats.present}</h3>
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-card p-6">
          <p className="text-[10px] font-black uppercase text-rose-600 tracking-widest mb-1">Absent Count</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold font-outfit text-rose-600">{stats.absent}</h3>
            <XCircle className="h-6 w-6 text-rose-500" />
          </div>
        </Card>
      </div>

      {/* Class Level Registers */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold font-outfit text-navy-900 dark:text-white">Class Registers ({selectedDate})</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {settings?.classes?.map(cls => {
            const classStudents = students.filter(s => s.class === cls);
            const classPresent = attendanceRecords.filter(r => r.className === cls && r.status === 'present').length;
            const duty = dailyAssignments.find(a => a.className === cls && a.dutyDate === selectedDate);

            return (
              <Card key={cls} className="border-none shadow-card rounded-3xl bg-white dark:bg-card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="font-bold text-xs">{cls}</Badge>
                    <span className="text-xs font-bold text-primary-600">{classPresent} / {classStudents.length}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Proctor: <strong>{duty ? duty.teacherName : 'Not Assigned'}</strong>
                  </p>
                </div>
                {selectedExam && (
                  <Button variant="outline" className="w-full rounded-2xl mt-4 font-bold text-xs" asChild>
                    <Link href={`/admin/attendance/manage/${selectedExam}/${selectedDate}/${encodeURIComponent(cls)}`}>
                      <Edit3 className="h-3.5 w-3.5 mr-2" />
                      Manage Register
                    </Link>
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
