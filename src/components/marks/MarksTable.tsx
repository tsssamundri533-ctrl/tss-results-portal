'use client';

import React, { useMemo, useState, useEffect } from 'react';
import debounce from 'lodash.debounce';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, CircleCheckBig, Cloud, CloudOff, UserX } from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { Student, Mark, Attendance } from '@/types';
import { cn } from '@/lib/utils';
import { saveMarksBatch } from '@/lib/supabase-service';

interface MarksTableProps {
  students: Student[];
  marks: Mark[];
  attendanceRecords?: Attendance[];
  examId: string;
  subjectId: string;
  classId: string;
  maxMarks: number;
  subjectName: string;
  schoolId: string;
  isLocked: boolean;
}

export function MarksTable({ 
  students, 
  marks, 
  attendanceRecords = [],
  examId, 
  subjectId, 
  classId, 
  maxMarks, 
  subjectName,
  schoolId,
  isLocked
}: MarksTableProps) {
  const { user } = useAuthStore();
  const [localMarks, setLocalMarks] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState<Set<string>>(new Set());

  useEffect(() => {
    const markMap: Record<string, string> = {};
    marks.forEach(m => {
      markMap[m.studentId] = m.marks.toString();
    });
    setLocalMarks(markMap);
  }, [marks]);

  const calculateGrade = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 90) return { label: 'A+', color: 'bg-indigo-600' };
    if (percentage >= 80) return { label: 'A', color: 'bg-blue-600' };
    if (percentage >= 70) return { label: 'B', color: 'bg-emerald-600' };
    if (percentage >= 60) return { label: 'C', color: 'bg-amber-500' };
    if (percentage >= 50) return { label: 'D', color: 'bg-orange-500' };
    return { label: 'F', color: 'bg-rose-500' };
  };

  const debouncedSave = useMemo(
    () =>
      debounce(async (studentId: string, score: number, studentName: string) => {
        const markId = `${examId}_${subjectId}_${studentId}`;
        
        // 1. Instant Save directly to Supabase
        await saveMarksBatch([{
          id: markId,
          studentId,
          studentName,
          examId,
          subjectId,
          classId,
          marks: score,
          maxMarks,
          enteredBy: user?.email || user?.uid || 'Admin',
        }]);
        
        setSyncing(prev => {
          const next = new Set(prev);
          next.delete(studentId);
          return next;
        });
      }, 500),
    [examId, subjectId, schoolId, maxMarks, classId, user]
  );

  const handleChange = (studentId: string, value: string, studentName: string) => {
    if (isLocked) return;

    const num = parseInt(value);
    if (value !== "" && (isNaN(num) || num < 0 || num > maxMarks)) return;

    setLocalMarks(prev => ({ ...prev, [studentId]: value }));
    
    if (value !== "") {
      setSyncing(prev => new Set(prev).add(studentId));
      debouncedSave(studentId, num, studentName);
    }
  };

  return (
    <div className="space-y-4">
      {/* MOBILE CARD VIEW (< md) - Clean, thumb-friendly numeric intake */}
      <div className="block md:hidden space-y-3">
        {students.map((student) => {
          const currentScore = parseInt(localMarks[student.id] || "0");
          const grade = localMarks[student.id] ? calculateGrade(currentScore, maxMarks) : null;
          const isSyncing = syncing.has(student.id);
          const attendanceRecord = attendanceRecords.find(r => r.studentId === student.id);
          const isAbsent = attendanceRecord?.status === 'absent';

          return (
            <div 
              key={`m-card-${student.id}`} 
              className={cn(
                "p-4 rounded-2xl bg-white dark:bg-card border transition-all shadow-sm space-y-3",
                isAbsent ? "border-rose-200 dark:border-rose-900/40 bg-rose-50/20" : "border-slate-100 dark:border-white/5"
              )}
            >
              {/* Header: Roll, Avatar, Name */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-mono font-black text-sm flex items-center justify-center shrink-0 border border-primary-100 dark:border-white/5 shadow-inner">
                    #{student.rollNumber}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate leading-snug">{student.name || 'Unknown Student'}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-medium truncate">S/O {student.fatherName || '—'}</p>
                  </div>
                </div>

                {isAbsent ? (
                  <Badge variant="outline" className="border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[9px] font-black uppercase px-2 py-0.5 shrink-0">
                    Absent
                  </Badge>
                ) : grade ? (
                  <Badge className={cn("h-7 px-2.5 rounded-lg font-black text-xs text-white shrink-0", grade.color)}>
                    Grade {grade.label}
                  </Badge>
                ) : null}
              </div>

              {/* Input Area */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Score / {maxMarks}:
                  </span>
                  {isSyncing && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-primary-600 animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                    </span>
                  )}
                  {localMarks[student.id] && !isSyncing && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600">
                      <CircleCheckBig className="h-3 w-3" /> Saved
                    </span>
                  )}
                </div>

                {isAbsent ? (
                  <div className="h-11 px-5 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 font-black text-xs flex items-center justify-center">
                    ABSENT (0)
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={localMarks[student.id] || ""}
                      onChange={(e) => handleChange(student.id, e.target.value, student.name)}
                      disabled={isLocked}
                      className={cn(
                        "w-28 h-11 text-center text-lg font-black rounded-xl border-2 transition-all tabular-nums",
                        localMarks[student.id] 
                          ? "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" 
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200",
                        isLocked && "opacity-50 cursor-not-allowed"
                      )}
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP TABLE VIEW (>= md) */}
      <div className="hidden md:block bg-white dark:bg-card rounded-3xl shadow-card overflow-hidden border border-slate-100 dark:border-white/5 transition-colors">
        <div className="overflow-x-auto scrollbar-hide">
          <Table className="min-w-[600px]">
            <TableHeader className="bg-slate-50 dark:bg-white/5">
              <TableRow className="hover:bg-transparent border-slate-100 dark:border-white/5">
                <TableHead className="w-[100px] font-black uppercase tracking-widest text-[10px] text-slate-400 dark:text-slate-500 pl-8">Roll No</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400 dark:text-slate-500">Student</TableHead>
                <TableHead className="w-[150px] text-center font-black uppercase tracking-widest text-[10px] text-slate-400 dark:text-slate-500">Score / {maxMarks}</TableHead>
                <TableHead className="w-[100px] text-center font-black uppercase tracking-widest text-[10px] text-slate-400 dark:text-slate-500 pr-8">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const currentScore = parseInt(localMarks[student.id] || "0");
                const grade = localMarks[student.id] ? calculateGrade(currentScore, maxMarks) : null;
                const isSyncing = syncing.has(student.id);
                const attendanceRecord = attendanceRecords.find(r => r.studentId === student.id);
                const isAbsent = attendanceRecord?.status === 'absent';

                return (
                  <TableRow key={student.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-slate-50 dark:border-white/5 h-20">
                    <TableCell className="font-mono font-bold text-slate-400 dark:text-slate-600 pl-8">
                      {student.rollNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 rounded-xl border border-slate-100 dark:border-white/10 hidden sm:flex">
                          <AvatarImage src={student.photoURL} />
                          <AvatarFallback className="bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold text-xs">
                            {student.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white leading-none truncate max-w-[150px] sm:max-w-none">{student.name || 'Unknown Student'}</p>
                          <div className="flex items-center gap-2 mt-1 whitespace-nowrap">
                             <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-medium">S/O {student.fatherName || '—'}</p>
                             {isAbsent && (
                               <Badge variant="outline" className="h-4 border-rose-100 dark:border-rose-900 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[8px] font-black uppercase px-1.5">
                                 Absent
                               </Badge>
                             )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="relative inline-block">
                        {isAbsent ? (
                          <div className="w-24 h-12 flex items-center justify-center">
                            <span className="text-2xl font-black text-rose-600 dark:text-rose-500 animate-in fade-in zoom-in-95">A</span>
                          </div>
                        ) : (
                          <>
                            <Input
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={localMarks[student.id] || ""}
                              onChange={(e) => handleChange(student.id, e.target.value, student.name)}
                              disabled={isLocked}
                              className={cn(
                                "w-20 sm:w-24 h-12 text-center text-lg font-black rounded-xl border-2 transition-all tabular-nums",
                                localMarks[student.id] 
                                  ? "border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" 
                                  : "border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-600",
                                isLocked && "opacity-50 cursor-not-allowed"
                              )}
                              placeholder="—"
                            />
                            {isSyncing && (
                              <div className="absolute -right-6 sm:-right-8 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-primary-600 dark:text-primary-400" />
                              </div>
                            )}
                            {localMarks[student.id] && !isSyncing && (
                              <div className="absolute -right-6 sm:-right-8 top-1/2 -translate-y-1/2">
                                <CircleCheckBig className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center pr-8">
                      {isAbsent ? (
                        <Badge className="h-8 w-8 flex items-center justify-center rounded-lg p-0 font-black text-sm bg-rose-600">F</Badge>
                      ) : grade ? (
                        <Badge className={cn("h-8 w-8 flex items-center justify-center rounded-lg p-0 font-black text-sm", grade.color)}>{grade.label}</Badge>
                      ) : (
                        <span className="text-slate-200 dark:text-slate-800 font-black">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}