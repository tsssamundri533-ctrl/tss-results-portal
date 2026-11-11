'use client';

import { use, useEffect, useState } from 'react';
import { 
  ChevronLeft, 
  Printer, 
  Loader2, 
  Award,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSchoolStore } from '@/store/use-school-store';
import { useSchoolSettings } from '@/hooks/use-school-settings';
import { Result, Exam, Student } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  getStudentById, 
  getExamById, 
  getResultByStudent,
  getMultiTermReport,
  MultiTermStudentReport
} from '@/lib/supabase-service';

export default function StudentResultDetailPage({ params }: { params: Promise<{ examId: string, studentId: string }> }) {
  const { examId, studentId } = use(params);
  useSchoolSettings();
  const settings = useSchoolStore(state => state.settings);

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<Result | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [multiTerm, setMultiTerm] = useState<MultiTermStudentReport | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [resData, exData, stData, mtData] = await Promise.all([
          getResultByStudent(examId, studentId),
          getExamById(examId),
          getStudentById(studentId),
          getMultiTermReport(studentId)
        ]);
        setResult(resData);
        setExam(exData);
        setStudent(stData);
        setMultiTerm(mtData);
      } catch (err) {
        console.error('Error loading result detail:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [examId, studentId]);

  if (loading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        <p className="font-bold text-muted-foreground uppercase text-xs tracking-widest">Loading Academic Record...</p>
      </div>
    );
  }

  if (!result || !student) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <XCircle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-black uppercase text-foreground">Result Record Not Found</h2>
        <p className="text-muted-foreground text-sm">Please compute results for this class and assessment cycle first.</p>
        <Button asChild variant="outline" className="rounded-2xl border-border">
          <Link href="/admin/results"><ChevronLeft className="h-4 w-4 mr-2" /> Back to Results</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32 pt-4 font-inter px-4 sm:px-0">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button asChild variant="ghost" className="w-fit rounded-2xl gap-2 font-bold text-muted-foreground hover:text-foreground">
          <Link href="/admin/results">
            <ChevronLeft className="h-4 w-4" /> Back to Gazette
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <Button asChild className="rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold gap-2 shadow-sm">
            <Link href={`/admin/print/result/${examId}/${studentId}`}>
              <Printer className="h-4 w-4" /> Open Printable Result Card
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Performance Banner */}
      <Card className="border border-border shadow-sm rounded-[2.5rem] overflow-hidden bg-card text-card-foreground">
        <div className="bg-gradient-to-r from-blue-950 via-navy-900 to-slate-900 dark:from-slate-950 dark:via-navy-950 dark:to-slate-900 text-white p-8 md:p-12 border-b border-border">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                {student.photoURL ? (
                  <img src={student.photoURL} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-white">{student.name.charAt(0)}</span>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white font-outfit">{student.name}</h1>
                  <Badge className="bg-primary-500 text-white font-black uppercase text-[10px] px-2.5 py-0.5 border-none">
                    Roll #{student.rollNumber}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-slate-300 uppercase">
                  Class: {student.class} — {student.section} • Father: {student.fatherName || '—'}
                </p>
                <p className="text-xs font-bold text-primary-300 uppercase tracking-widest pt-1">
                  {exam?.title || 'Examination Cycle'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-3xl p-6 self-stretch md:self-auto justify-around md:justify-start">
              <div className="text-center px-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Score</p>
                <p className="text-3xl font-black text-white">{result.totalObtained}<span className="text-xs text-slate-400 font-normal">/{result.totalMax}</span></p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center px-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Percentage</p>
                <p className="text-3xl font-black text-primary-400">{result.percentage}%</p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center px-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grade</p>
                <p className="text-3xl font-black text-emerald-400">{result.grade}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Term Overview Tab / Banner */}
        {multiTerm && (
          <div className="bg-indigo-50/70 dark:bg-indigo-950/20 p-6 border-b border-indigo-100 dark:border-indigo-900/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                  Academic Year 2026 Multi-Term Record
                </p>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                  {multiTerm.term1Result ? 'First Term Recorded' : 'First Term Pending'} • {multiTerm.term2Result ? 'Second Term Recorded' : 'Second Term Pending'}
                </p>
              </div>
            </div>

            <Button asChild variant="outline" size="sm" className="rounded-xl border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-card hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
              <Link href={`/admin/print/result/${examId}/${studentId}`}>
                View Combined Result Card →
              </Link>
            </Button>
          </div>
        )}

        {/* Subject-Wise Breakdown Table */}
        <CardContent className="p-8">
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-muted-foreground mb-6">Subject-Wise Marks Breakdown</h3>
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                  <th className="py-4 px-6">Subject</th>
                  <th className="py-4 px-4 text-center">Max Marks</th>
                  <th className="py-4 px-4 text-center">Obtained Marks</th>
                  <th className="py-4 px-4 text-center">Percentage</th>
                  <th className="py-4 px-6 text-right">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-bold text-sm">
                {Object.entries(result.subjects).map(([subId, sub]) => {
                  const pct = sub.maxMarks > 0 ? Math.round((sub.marks / sub.maxMarks) * 100) : 0;
                  return (
                    <tr key={subId} className="hover:bg-muted/30">
                      <td className="py-4 px-6 font-black uppercase text-foreground">{sub.name}</td>
                      <td className="py-4 px-4 text-center text-muted-foreground">{sub.maxMarks}</td>
                      <td className="py-4 px-4 text-center font-black text-primary-600 dark:text-primary-400 text-base">{sub.marks}</td>
                      <td className="py-4 px-4 text-center text-muted-foreground">{pct}%</td>
                      <td className="py-4 px-6 text-right">
                        <span className="inline-block w-8 h-8 rounded-lg bg-muted text-foreground border border-border text-center leading-8 font-black text-xs">
                          {sub.grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
