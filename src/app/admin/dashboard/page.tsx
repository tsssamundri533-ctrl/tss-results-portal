'use client';

import { 
  Users, 
  FileText,
  Trophy,
  Tickets,
  Zap,
  TrendingUp,
  Clock,
  ChevronRight,
  ShieldCheck,
  CalendarCheck,
  PenTool,
  Printer,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSchoolStore } from '@/store/use-school-store';
import { useSchoolSettings } from '@/hooks/use-school-settings';
import { useExamStore } from '@/store/use-exam-store';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { getDashboardStats, DashboardStats, getExams } from '@/lib/supabase-service';

export default function AdminDashboardPage() {
  useSchoolSettings();
  const { settings } = useSchoolStore();
  const { activeExamId, exams, setExams } = useExamStore();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const [statsData, examsData] = await Promise.all([
          getDashboardStats(),
          getExams()
        ]);
        setStats(statsData);
        if (examsData?.length) {
          setExams(examsData);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [setExams]);

  const activeExam = useMemo(() => {
    return exams.find(e => e.id === activeExamId) || exams[0] || null;
  }, [exams, activeExamId]);

  const previousExam = useMemo(() => {
    return exams.find(e => e.id !== activeExam?.id) || null;
  }, [exams, activeExam]);

  const quickLinks = [
    { 
      label: 'Marks Entry', 
      desc: activeExam ? `Record ${activeExam.title}` : 'Record & edit scores',
      href: activeExam ? `/admin/marks/${activeExam.id}` : '/admin/marks', 
      icon: PenTool, 
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40' 
    },
    { 
      label: 'Results & Cards', 
      desc: 'Term & combined gazettes',
      href: '/admin/results', 
      icon: Trophy, 
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' 
    },
    { 
      label: 'Students Directory', 
      desc: 'Active student roster',
      href: '/admin/students', 
      icon: Users, 
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' 
    },
    { 
      label: 'Roll Number Slips', 
      desc: 'Print student admit cards',
      href: '/admin/slips', 
      icon: Tickets, 
      color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40' 
    },
    { 
      label: 'Assessment Cycles', 
      desc: activeExam ? `Current: ${activeExam.title}` : 'Manage institutional terms',
      href: '/admin/exams', 
      icon: Layers, 
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' 
    },
    { 
      label: 'School Settings', 
      desc: 'Profile & preferences',
      href: '/admin/settings', 
      icon: ShieldCheck, 
      color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/40' 
    }
  ];

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto pb-32 font-inter px-4 sm:px-6">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary-600 dark:text-primary-400 fill-primary-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">
              Institutional Administration
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground font-outfit uppercase">
            School Dashboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-medium">
            {settings?.profile?.schoolName || 'The Spirit School Samundri Campus'} • Academic Session {settings?.activeSession?.title || '2026'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild className="rounded-2xl shadow-lg h-12 px-6 gap-2 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-wider text-xs">
            <Link href="/admin/marks">
              <PenTool className="h-4 w-4" /> Enter Marks
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-2xl h-12 px-6 gap-2 font-black uppercase tracking-wider text-xs border-border bg-card hover:bg-muted text-foreground">
            <Link href="/admin/results">
              <Trophy className="h-4 w-4" /> View Gazette
            </Link>
          </Button>
        </div>
      </header>

      {/* Multi-Term Status Highlight Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-navy-950 dark:from-blue-950 dark:via-indigo-950 dark:to-slate-950 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-blue-800/40 dark:border-blue-900/30">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 border-none">
              {activeExam?.title || 'Academic Assessment System'} Active
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-outfit uppercase tracking-tight text-white">
            {activeExam ? `${activeExam.title} Academic Assessment` : 'Institutional Examination System'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
            {activeExam 
              ? `${activeExam.title} is currently active for subject scores recording, date sheets, and report card generation.${previousExam ? ` Records for ${previousExam.title} remain safely archived and accessible.` : ''}`
              : 'All assessment records and student evaluations are synchronized across the institution.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="secondary" className="rounded-xl font-bold text-xs gap-2 bg-white text-navy-950 hover:bg-slate-100 shadow-sm">
            <Link href="/admin/results">
              <Printer className="h-4 w-4" /> Print Result Cards
            </Link>
          </Button>
          <Button asChild className="rounded-xl font-bold text-xs gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Link href={activeExam ? `/admin/marks/${activeExam.id}` : "/admin/marks"}>
              <TrendingUp className="h-4 w-4" /> Enter {activeExam ? activeExam.title : 'Scores'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metric Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))
        ) : (
          <>
            <Card className="border border-border shadow-sm rounded-3xl bg-card text-card-foreground p-6 hover:shadow-md transition-shadow">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-2">Total Students Enrolled</p>
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-3xl font-black font-outfit text-foreground">
                    {stats?.totalStudents || 0}
                  </h3>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">Active Students Registry</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </Card>

            <Card className="border border-border shadow-sm rounded-3xl bg-card text-card-foreground p-6 hover:shadow-md transition-shadow">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-2">Marks Recorded</p>
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-3xl font-black font-outfit text-foreground">
                    {stats?.totalMarks || 0}
                  </h3>
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1">Across All Subjects</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
            </Card>

            <Card className="border border-border shadow-sm rounded-3xl bg-card text-card-foreground p-6 hover:shadow-md transition-shadow">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-2">Computed Results</p>
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-3xl font-black font-outfit text-foreground">
                    {stats?.totalResults || 0}
                  </h3>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">Gazette Snapshots</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Trophy className="h-6 w-6" />
                </div>
              </div>
            </Card>

            <Card className="border border-border shadow-sm rounded-3xl bg-card text-card-foreground p-6 hover:shadow-md transition-shadow">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-2">Academic Terms</p>
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-3xl font-black font-outfit text-foreground">
                    {stats?.exams.length || 0}
                  </h3>
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1">1st & 2nd Term 2026</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Layers className="h-6 w-6" />
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Primary Navigation Hub (Quick Actions) */}
      <Card className="border border-border shadow-sm rounded-3xl bg-card text-card-foreground overflow-hidden">
        <CardHeader className="bg-muted/40 p-6 md:p-8 border-b border-border">
          <CardTitle className="text-xl font-black font-outfit uppercase tracking-tight text-foreground">
            Quick Actions & Modules
          </CardTitle>
          <CardDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Select a module to perform administrative operations
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickLinks.map((link, idx) => (
            <Link 
              key={idx} 
              href={link.href}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-muted/30 hover:bg-card hover:shadow-lg border border-border/60 hover:border-border transition-all group"
            >
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${link.color}`}>
                <link.icon className="h-7 w-7" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-foreground mb-1">
                {link.label}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                {link.desc}
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Assessment Cycles Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {stats?.exams.map((exam) => (
          <Card key={exam.id} className="border border-border shadow-sm rounded-3xl bg-card text-card-foreground p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <Badge className={exam.examTypeId === 'second-term' ? 'bg-indigo-600 text-white font-bold' : 'bg-blue-600 text-white font-bold'}>
                  {exam.title}
                </Badge>
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                  Year {exam.year}
                </span>
              </div>
              <h3 className="text-xl font-black text-foreground uppercase mb-2">
                {exam.title}
              </h3>
              <p className="text-xs text-muted-foreground font-medium mb-4">
                Configured Classes: {exam.classes?.join(', ') || 'Classes 3 to 8'}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <Button asChild size="sm" className="rounded-xl font-bold text-xs gap-1 flex-1 bg-primary-600 hover:bg-primary-700 text-white">
                <Link href={`/admin/marks`}>
                  <PenTool className="h-3.5 w-3.5 mr-1" /> Enter Marks
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-xl font-bold text-xs gap-1 flex-1 border-border bg-card hover:bg-muted text-foreground">
                <Link href={`/admin/results`}>
                  <Trophy className="h-3.5 w-3.5 mr-1" /> View Results
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
