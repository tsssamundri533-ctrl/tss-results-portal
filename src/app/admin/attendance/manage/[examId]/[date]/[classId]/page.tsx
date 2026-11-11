'use client';

import { use, useMemo, useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  CalendarDays,
  Users,
  ShieldCheck,
  CheckCircle,
  X,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/use-auth-store';
import { useRouter } from 'next/navigation';
import { Student, Attendance, Exam } from '@/types';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getStudents, getExamById } from '@/lib/supabase-service';
import { getAttendanceRecords, saveAttendanceRecord, saveAttendanceBatch } from '@/lib/attendance-service';

export default function AdminManualAttendanceManager({ params }: { params: Promise<{ examId: string, date: string, classId: string }> }) {
  const { examId, date, classId } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [processingBulk, setProcessingBulk] = useState(false);
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [exam, setExam] = useState<Exam | null>(null);

  const targetClass = decodeURIComponent(classId);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsList, records, examData] = await Promise.all([
        getStudents(targetClass),
        getAttendanceRecords(examId, date),
        getExamById(examId)
      ]);
      setStudents(studentsList.filter(s => s.status === 'active'));
      setAttendanceRecords(records);
      setExam(examData);
    } catch (err) {
      console.error('Failed to load attendance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [examId, date, targetClass]);

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
      markedBy: user?.email || user?.uid || 'Admin',
      timestamp: new Date().toISOString()
    };

    await saveAttendanceRecord(examId, date, record);
    setAttendanceRecords(prev => {
      const filtered = prev.filter(r => r.studentId !== student.id);
      return [...filtered, record];
    });
  };

  const handleBulkMark = async (status: 'present' | 'absent') => {
    if (!filteredStudents.length || processingBulk) return;
    
    if (!window.confirm(`Mark all ${filteredStudents.length} students in Grade ${targetClass} as ${status.toUpperCase()}?`)) return;

    setProcessingBulk(true);
    try {
      const timestamp = new Date().toISOString();
      const records: Attendance[] = filteredStudents.map(student => ({
        id: student.id,
        studentId: student.id,
        studentName: student.name,
        className: student.class,
        sectionName: student.section,
        status,
        markedAt: timestamp,
        markedBy: user?.email || user?.uid || 'Admin',
        timestamp
      }));

      await saveAttendanceBatch(examId, date, records);
      setAttendanceRecords(prev => {
        const studentIds = new Set(filteredStudents.map(s => s.id));
        const kept = prev.filter(r => !studentIds.has(r.studentId));
        return [...kept, ...records];
      });

      toast({ title: `Bulk Entry Success`, description: `All candidates marked as ${status}.` });
    } catch (e) {
      toast({ title: "Bulk Marking Failed", variant: "destructive" });
    } finally {
      setProcessingBulk(false);
    }
  };

  const getStatus = (studentId: string) => attendanceRecords.find(r => r.studentId === studentId)?.status;

  const stats = useMemo(() => {
    if (!filteredStudents.length) return { present: 0, total: 0 };
    return {
      present: filteredStudents.filter(s => getStatus(s.id) === 'present').length,
      total: filteredStudents.length
    };
  }, [filteredStudents, attendanceRecords]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32 px-4 sm:px-0">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit">
                {targetClass} Register
              </h1>
              <Badge variant="outline" className="border-primary-600 text-primary-600 font-bold">
                {date}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {exam?.title || 'Examination'} • {stats.present} / {stats.total} Present
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleBulkMark('present')}
            disabled={processingBulk}
            className="rounded-xl font-bold text-xs border-emerald-500 text-emerald-600 hover:bg-emerald-50"
          >
            Mark All Present
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleBulkMark('absent')}
            disabled={processingBulk}
            className="rounded-xl font-bold text-xs border-rose-500 text-rose-600 hover:bg-rose-50"
          >
            Mark All Absent
          </Button>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Filter students by name or roll number..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9 h-11 rounded-2xl bg-white dark:bg-card border-none shadow-sm"
        />
      </div>

      <div className="space-y-3">
        {filteredStudents.map(student => {
          const status = getStatus(student.id);
          return (
            <Card key={student.id} className="border-none shadow-sm rounded-2xl bg-white dark:bg-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-xl">
                  <AvatarImage src={student.photoURL} />
                  <AvatarFallback className="font-bold text-xs">{student.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary-600">#{student.rollNumber}</span>
                    <h4 className="font-bold text-sm text-navy-900 dark:text-white">{student.name}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">F: {student.fatherName || 'N/A'} • Sec: {student.section}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={status === 'present' ? 'default' : 'outline'}
                  onClick={() => markAttendance(student, 'present')}
                  className={cn(
                    "rounded-xl font-bold text-xs h-9 px-4",
                    status === 'present' ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-emerald-200 text-emerald-600"
                  )}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Present
                </Button>
                <Button
                  size="sm"
                  variant={status === 'absent' ? 'default' : 'outline'}
                  onClick={() => markAttendance(student, 'absent')}
                  className={cn(
                    "rounded-xl font-bold text-xs h-9 px-4",
                    status === 'absent' ? "bg-rose-600 hover:bg-rose-700 text-white" : "border-rose-200 text-rose-600"
                  )}
                >
                  <XCircle className="h-4 w-4 mr-1" />
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
