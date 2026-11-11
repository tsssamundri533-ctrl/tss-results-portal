'use client';

import { 
  BookOpen, 
  Loader2,
  ChevronRight,
  Zap,
  ShieldCheck,
  QrCode,
  Sparkles,
  ArrowUpRight,
  User,
  Star,
  CheckCircle2,
  Cloud
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/use-auth-store';
import { Assignment, Mark, Student } from '@/types';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getStaffAssignments, getStudents, getMarks } from '@/lib/supabase-service';

export default function TeacherDashboardPage() {
  const { user, schoolId, userName, userPhotoURL } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    setMounted(true);
    async function loadTeacherData() {
      if (!user) return;
      try {
        setLoading(true);
        const [aData, sData] = await Promise.all([
          getStaffAssignments(user.uid),
          getStudents()
        ]);
        setAssignments(aData);
        setAllStudents(sData);
      } catch (err) {
        console.error('Failed to load teacher dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTeacherData();
  }, [user]);

  // 2. Today's Proctoring Duty Filter
  const todayDuties = useMemo(() => {
    return assignments.filter(a => a.dutyDate === todayStr && a.isAttendanceLead);
  }, [assignments, todayStr]);

  if (loading || !mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.3em]">Opening Secure Hub...</p>
      </div>
    );
  }

  const workAssignments = assignments.filter(a => !a.isAttendanceLead);

  return (
    <div className="space-y-10 sm:space-y-16 max-w-5xl mx-auto pb-32 pt-4">
      
      {/* --- ELITE PERSONAL IDENTITY HERO --- */}
      <section className="flex flex-col items-center text-center space-y-6 px-4">
        <div className="relative">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10"
          >
            <Avatar className="h-28 w-28 sm:h-36 sm:w-36 rounded-[2.5rem] sm:rounded-[3.5rem] border-[6px] border-white dark:border-navy-900 shadow-2xl ring-4 ring-primary-500/10 transition-all hover:scale-105 hover:rotate-3">
              <AvatarImage src={userPhotoURL || ''} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-tr from-primary-600 to-indigo-600 text-white text-4xl font-black uppercase font-outfit">
                {userName?.[0] || 'T'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl shadow-xl border-4 border-white dark:border-navy-900 animate-bounce">
              <Star className="h-5 w-5 fill-white" />
            </div>
          </motion.div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-6 border-2 border-dashed border-primary-500/20 rounded-full pointer-events-none"
          />
        </div>

        <div className="space-y-2">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-navy-900 dark:text-white font-outfit">
              Welcome back, <span className="text-primary-600 dark:text-primary-400">{userName?.split(' ')[0]}!</span>
            </h2>
            <p className="text-muted-foreground font-medium text-sm sm:text-base mt-2">
              Ready to manage your <span className="font-bold text-navy-900 dark:text-slate-200">academic workspace</span> for today?
            </p>
          </motion.div>
          
          <div className="flex items-center justify-center gap-3 pt-2">
             <Badge className="bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 border-none font-black text-[9px] uppercase h-6 px-4 rounded-full">
               Faculty Grade: Authorized
             </Badge>
             <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-none font-black text-[9px] uppercase h-6 px-4 rounded-full">
               Terminal: Sync Active
             </Badge>
          </div>
        </div>
      </section>

      {/* --- HIGH-FIDELITY DUTY TERMINAL --- */}
      {todayDuties.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 sm:px-0"
        >
          <Card className="border-none shadow-3xl rounded-[3rem] bg-gradient-to-tr from-primary-600 to-indigo-700 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
               <Zap className="h-48 w-48 rotate-12" />
            </div>
            <CardContent className="p-10 md:p-14 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex items-center gap-8">
                  <div className="h-20 w-20 rounded-[2rem] bg-white/20 flex items-center justify-center backdrop-blur-md shadow-2xl border border-white/20">
                    <QrCode className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-3xl sm:text-4xl font-black font-outfit uppercase leading-tight tracking-tight">Today's Duty</h2>
                    <p className="text-white/60 font-bold text-[11px] uppercase tracking-[0.4em] mt-2">Class Proctoring Phase Active</p>
                  </div>
                </div>
                <Button asChild className="h-16 px-12 rounded-[2rem] bg-white text-primary-600 hover:bg-slate-50 font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95 w-full md:w-auto">
                  <Link href="/teacher/attendance">Launch Scanner <ArrowUpRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* --- CURRICULUM ASSIGNMENTS GRID --- */}
      <div className="space-y-12 px-4 sm:px-0">
        <div className="flex flex-col items-center text-center space-y-2">
           <div className="h-1.5 w-12 bg-primary-600 rounded-full mb-2" />
           <h2 className="text-2xl font-black font-outfit uppercase tracking-tight text-navy-900 dark:text-white">Assigned Subjects</h2>
           <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em]">Curriculum Mapping & Marks Intake</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {workAssignments.map((assignment, idx) => {
            const subjectMarks = marks?.filter(m => m.subjectId === assignment.subjectId && m.classId === assignment.className && m.sectionName === assignment.sectionName) || [];
            const classStudents = allStudents?.filter(s => s.class === assignment.className && s.section === assignment.sectionName) || [];
            const studentCount = classStudents.length || 1;
            const completionPct = Math.min(100, Math.round((subjectMarks.length / studentCount) * 100));

            return (
              <motion.div 
                key={assignment.id} 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <Card className="border-none shadow-card rounded-[2.5rem] bg-white dark:bg-card overflow-hidden group transition-all duration-500 border border-slate-100 dark:border-white/5 h-full">
                   <CardContent className="p-8 sm:p-10">
                      <div className="flex items-center justify-between mb-8">
                         <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-black text-2xl shadow-inner border border-primary-100 dark:border-white/5 transition-transform group-hover:scale-110">
                               {assignment.className[0]}
                            </div>
                            <div>
                               <p className="font-black text-navy-900 dark:text-white text-xl leading-none mb-2 uppercase font-outfit truncate max-w-[150px]">{assignment.subject}</p>
                               <Badge variant="outline" className="border-slate-200 dark:border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400 h-5 px-3 rounded-lg">
                                 Grade {assignment.className} — {assignment.sectionName}
                               </Badge>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-slate-300 dark:text-slate-600 tracking-widest mb-1">Students</p>
                            <p className="text-2xl font-black font-outfit text-navy-900 dark:text-white leading-none tabular-nums">{studentCount}</p>
                         </div>
                      </div>

                      <div className="space-y-3 mb-10">
                         <div className="flex justify-between items-end px-1">
                            <span className="text-[9px] font-black uppercase text-primary-600 dark:text-primary-400 tracking-widest">Intake Completion</span>
                            <span className="text-lg font-black font-outfit text-navy-900 dark:text-white">{completionPct}%</span>
                         </div>
                         <div className="h-2 w-full bg-slate-100 dark:bg-navy-950 rounded-full overflow-hidden shadow-inner">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${completionPct}%` }}
                              transition={{ duration: 1.8, ease: "circOut", delay: idx * 0.2 }}
                              className={cn(
                                "h-full rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]", 
                                completionPct === 100 ? "bg-emerald-500" : "bg-primary-600"
                              )}
                            />
                         </div>
                      </div>

                      <Button asChild className="w-full h-14 rounded-2xl bg-slate-50 dark:bg-white/5 text-navy-900 dark:text-white hover:bg-primary-600 hover:text-white transition-all font-black uppercase tracking-widest text-[11px] gap-3 border-none shadow-none group/btn">
                         <Link href={`/teacher/marks`}>
                            Record Scores
                            <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                         </Link>
                      </Button>
                   </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {workAssignments.length === 0 && (
          <div className="py-24 text-center space-y-6">
            <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-navy-950 flex items-center justify-center mx-auto shadow-inner border border-slate-100 dark:border-white/10">
              <BookOpen className="h-10 w-10 text-slate-200 dark:text-slate-800" />
            </div>
            <div className="space-y-1">
               <p className="opacity-40 uppercase font-black text-[11px] tracking-[0.4em] max-w-xs mx-auto">Assignments Pending</p>
               <p className="text-slate-400 text-sm font-medium">Please contact the registrar to sync your faculty profile with the curriculum.</p>
            </div>
          </div>
        )}

        {/* --- SYSTEM INTEGRITY BADGE --- */}
        <div className="pt-12 flex flex-col items-center">
           <div className="p-8 bg-slate-50/50 dark:bg-navy-950/50 rounded-[3rem] border border-slate-100 dark:border-white/5 max-w-lg w-full flex flex-col items-center text-center gap-5 shadow-inner">
              <div className="h-16 w-16 rounded-[1.5rem] bg-white dark:bg-navy-900 flex items-center justify-center text-emerald-500 shadow-xl border border-slate-100 dark:border-white/5 relative">
                <Cloud className="h-8 w-8" />
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-[1.5rem] bg-emerald-500/20"
                />
              </div>
              <div className="space-y-2">
                 <p className="text-navy-900 dark:text-primary-400 font-black uppercase text-[11px] tracking-[0.3em]">Workstation Integrity Verified</p>
                 <p className="text-slate-500 dark:text-slate-500 text-xs font-medium leading-relaxed italic">
                   "This terminal is digitally signed. All attendance and marks data are synchronized with the primary institutional registry in real-time."
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

