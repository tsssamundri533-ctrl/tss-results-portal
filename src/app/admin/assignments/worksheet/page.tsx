'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  ClipboardList, 
  UserCheck, 
  Loader2, 
  ChevronRight, 
  School, 
  ArrowRight, 
  CheckCircle2, 
  X, 
  Search, 
  User, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  Plus, 
  CalendarDays, 
  Sparkles 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';
import { useSchoolStore } from '@/store/use-school-store';
import { useToast } from '@/hooks/use-toast';
import { Assignment, UserProfile } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, startOfToday, parseISO, isAfter } from 'date-fns';
import Link from 'next/link';
import { getStaff, getStaffAssignments, upsertStaffAssignment, deleteStaffAssignment } from '@/lib/supabase-service';

export default function AttendanceDutyWorksheet() {
  const { toast } = useToast();
  const settings = useSchoolStore(state => state.settings);
  const settingsLoading = useSchoolStore(state => state.isLoading);

  const [mounted, setMounted] = useState(false);
  const [activeClass, setActiveClass] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(startOfToday(), 'yyyy-MM-dd'));
  const [teacherSearch, setTeacherSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tList, aList] = await Promise.all([
        getStaff('teacher'),
        getStaffAssignments()
      ]);
      setTeachers(tList);
      setAssignments(aList);
    } catch (err) {
      console.error('Failed to load worksheet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const isPlanningAhead = useMemo(() => {
    if (!selectedDate) return false;
    return isAfter(parseISO(selectedDate), startOfToday());
  }, [selectedDate]);

  const activeDates = useMemo(() => {
    const dates = new Set<string>();
    dates.add(format(startOfToday(), 'yyyy-MM-dd'));
    assignments.forEach(a => {
      if (a.dutyDate) dates.add(a.dutyDate);
    });
    return Array.from(dates).sort().reverse().slice(0, 5);
  }, [assignments]);

  const availableClasses = useMemo(() => settings?.classes || [], [settings?.classes]);
  
  const filteredTeachers = useMemo(() => {
    const search = teacherSearch.toLowerCase();
    return teachers.filter(t => 
      (t.name || "").toLowerCase().includes(search) || 
      (t.email || "").toLowerCase().includes(search)
    ).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [teachers, teacherSearch]);

  const handleAssignLead = async (teacher: UserProfile) => {
    if (!activeClass || !settings || !selectedDate) return;

    setUpdating(activeClass);
    try {
      const existingLeads = assignments.filter(a => a.className === activeClass && a.dutyDate === selectedDate);
      for (const lead of existingLeads) {
        await deleteStaffAssignment(lead.id);
      }

      const assignmentId = `lead_${activeClass}_${selectedDate}`.replace(/\s+/g, '_');
      const assignmentData: Assignment = {
        id: assignmentId,
        teacherId: teacher.uid,
        teacherName: teacher.name || 'Unknown',
        className: activeClass,
        sectionName: 'All',
        subject: 'Attendance Lead',
        subjectName: 'Attendance Lead',
        subjectId: 'attendance_duty',
        isAttendanceLead: true,
        dutyDate: selectedDate,
        sessionId: settings.activeSession?.id || 'default',
        createdAt: new Date().toISOString(),
      };

      await upsertStaffAssignment(assignmentData);
      
      toast({
        title: isPlanningAhead ? "Advance Duty Signed" : "Duty Signed",
        description: `${teacher.name} authorized for ${activeClass} on ${format(parseISO(selectedDate), 'MMM dd')}.`,
      });
      setActiveClass(null);
      await loadData();
    } catch (e) {
      toast({ variant: "destructive", title: "Assignment Error" });
    } finally {
      setUpdating(null);
    }
  };

  if (!mounted || settingsLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Opening Duty Ledger...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 px-4 sm:px-0">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-navy-900 dark:text-white font-outfit">
              Proctoring Duty Roster
            </h1>
            <Badge variant="outline" className="border-primary-600 text-primary-600 font-bold uppercase text-[10px]">
              Daily Control
            </Badge>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Sign daily proctoring duties for teachers to take attendance in exam halls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Input 
            type="date" 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)}
            className="w-44 h-11 rounded-2xl bg-white dark:bg-card border-slate-200 dark:border-white/10 font-bold text-xs"
          />
        </div>
      </header>

      {/* Date Shortcuts */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {activeDates.map(d => (
          <Button
            key={d}
            variant={selectedDate === d ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedDate(d)}
            className="rounded-full text-xs font-bold"
          >
            {d === format(startOfToday(), 'yyyy-MM-dd') ? 'Today' : d}
          </Button>
        ))}
      </div>

      {/* Classes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {availableClasses.map(cls => {
          const lead = assignments.find(a => a.className === cls && a.dutyDate === selectedDate && a.isAttendanceLead);
          return (
            <Card key={cls} className="border-none shadow-card rounded-3xl bg-white dark:bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="secondary" className="font-bold text-xs">
                  {cls}
                </Badge>
                {lead ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px]">
                    Assigned
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-400 border-dashed text-[10px]">
                    Unassigned
                  </Badge>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-xs text-muted-foreground font-semibold">Proctor In-Charge:</p>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary-600" />
                  <p className="font-bold text-navy-900 dark:text-white text-sm">
                    {lead ? lead.teacherName : 'No Teacher Assigned'}
                  </p>
                </div>
              </div>

              <Button
                variant={lead ? "outline" : "default"}
                onClick={() => setActiveClass(cls)}
                className="w-full rounded-2xl font-bold text-xs h-10"
              >
                {lead ? 'Change Duty' : 'Assign Teacher'}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Modal to choose Teacher */}
      <Dialog open={!!activeClass} onOpenChange={open => !open && setActiveClass(null)}>
        <DialogContent className="rounded-3xl border-none shadow-modal dark:bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="font-outfit text-xl">Assign Proctor for {activeClass}</DialogTitle>
            <DialogDescription>Select the faculty member responsible for this hall on {selectedDate}.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search teacher name..."
                value={teacherSearch}
                onChange={e => setTeacherSearch(e.target.value)}
                className="pl-9 h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredTeachers.map(t => (
                <button
                  key={t.uid}
                  type="button"
                  onClick={() => handleAssignLead(t)}
                  className="w-full p-3 rounded-xl border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-left flex items-center justify-between transition-all"
                >
                  <div>
                    <p className="font-bold text-sm text-navy-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.email}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-primary-600 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
