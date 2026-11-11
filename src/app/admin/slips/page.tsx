'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Loader2, 
  Printer, 
  FileDown, 
  Users, 
  Calendar, 
  Save, 
  Trash2, 
  Plus, 
  ChevronLeft, 
  Layers, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  Wand2,
  Clock,
  CheckCircle2,
  Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/use-auth-store';
import { useSchoolStore } from '@/store/use-school-store';
import { useExamStore } from '@/store/use-exam-store';
import { getExams, updateExamClassConfigs, getStudents, getDateSheets, upsertDateSheet } from '@/lib/supabase-service';
import { PrintButton } from '@/components/print/PrintButton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Student, DateSheet, Exam } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdmitCardsPortal() {
  const { schoolId, user } = useAuthStore();
  const { settings } = useSchoolStore();
  const { activeExamId, exams: storeExams, setActiveExamId } = useExamStore();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [isWorkspaceActive, setIsWorkspaceActive] = useState(false);
  
  const [selectedCorridor, setSelectedCorridor] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Date Sheet State
  const [examTitle, setExamTitle] = useState("");
  const [papers, setPapers] = useState<DateSheet['papers']>([]);

  // Students and date sheet states from Supabase
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [savedDateSheet, setSavedDateSheet] = useState<DateSheet | null>(null);
  const [loadingDateSheet, setLoadingDateSheet] = useState(false);

  // Smart Date Rescheduler State
  const [bulkStartDate, setBulkStartDate] = useState("");
  const [skipSundays, setSkipSundays] = useState(true);

  // Load all exams from Supabase
  useEffect(() => {
    setMounted(true);
    async function loadExamsList() {
      try {
        const list = await getExams();
        setExams(list);
        const initialExamId = (activeExamId && list.some(e => e.id === activeExamId))
          ? activeExamId
          : (list[0]?.id || '');
        setSelectedExamId(initialExamId);
        if (!activeExamId && initialExamId) {
          setActiveExamId(initialExamId);
        }
        const match = list.find(e => e.id === initialExamId);
        if (match) {
          setExamTitle(match.title);
          if (match.startDate) {
            setBulkStartDate(match.startDate.split('T')[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load exams in AdmitCardsPortal:', err);
      }
    }
    loadExamsList();
  }, [activeExamId, setActiveExamId]);

  const selectedExam = useMemo(() => {
    return exams.find(e => e.id === selectedExamId) || null;
  }, [exams, selectedExamId]);

  // Sections derived from school settings based on selected class
  const availableSections = useMemo(() => {
    if (!selectedClass || !settings?.classSections) return [];
    return settings.classSections[selectedClass] || [];
  }, [selectedClass, settings?.classSections]);

  // Fetch saved date sheet for selected class + section (scoped to selectedExamId)
  const dateSheetId = useMemo(() => {
    if (!selectedClass || !selectedSection) return '';
    return selectedExamId 
      ? `${selectedExamId}_${selectedClass}_${selectedSection}`.replace(/\s+/g, '_')
      : `${selectedClass}_${selectedSection}`.replace(/\s+/g, '_');
  }, [selectedExamId, selectedClass, selectedSection]);

  useEffect(() => {
    if (!isWorkspaceActive || !selectedClass || !selectedSection) {
      setStudents([]);
      setSavedDateSheet(null);
      return;
    }
    async function loadWorkspaceData() {
      try {
        setStudentsLoading(true);
        setLoadingDateSheet(true);
        const [studentsList, sheets] = await Promise.all([
          getStudents(selectedClass, selectedSection),
          getDateSheets()
        ]);
        setStudents(studentsList.filter(s => s.status === 'active'));

        const match = sheets.find(s => s.id === dateSheetId || s.className === selectedClass) || null;
        setSavedDateSheet(match);
      } catch (err) {
        console.error('Failed to load workspace data:', err);
      } finally {
        setStudentsLoading(false);
        setLoadingDateSheet(false);
      }
    }
    loadWorkspaceData();
  }, [isWorkspaceActive, selectedClass, selectedSection, dateSheetId, selectedExam]);

  /**
   * Comprehensive pool of all available subjects across the curriculum,
   * active exams, previous exams, and current papers.
   */
  const availableSubjectOptions = useMemo(() => {
    const map = new Map<string, string>(); // id -> name

    // 1. From current selected exam's classConfigs
    if (selectedExam?.classConfigs?.[selectedClass]?.subjects) {
      Object.entries(selectedExam.classConfigs[selectedClass].subjects).forEach(([id, s]: any) => {
        if (s?.name) map.set(id, s.name);
      });
    }

    // 2. From all other exams (e.g. First Term 2026)
    exams.forEach(ex => {
      if (ex.classConfigs?.[selectedClass]?.subjects) {
        Object.entries(ex.classConfigs[selectedClass].subjects).forEach(([id, s]: any) => {
          if (s?.name && !map.has(id)) map.set(id, s.name);
        });
      }
    });

    // 3. From settings.subjects
    (settings?.subjects || []).forEach(s => {
      if (s?.name && !map.has(s.id)) map.set(s.id, s.name);
    });

    // 4. From current papers state
    papers.forEach(p => {
      if (p.subjectId && p.subjectName && !map.has(p.subjectId)) {
        map.set(p.subjectId, p.subjectName);
      }
    });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [selectedExam, exams, settings?.subjects, selectedClass, papers]);

  /**
   * Automatically resolve subjects from:
   * 1. Cloned selectedExam.classConfigs
   * 2. Other exams (e.g. First Term)
   * 3. Legacy date sheet in Firestore (${selectedClass}_${selectedSection})
   * 4. Settings subjects
   */
  const loadClonedOrPreviousPapers = async (): Promise<DateSheet['papers']> => {
    // 1. Try selectedExam.classConfigs
    if (selectedExam?.classConfigs?.[selectedClass]?.subjects) {
      const subsObj = selectedExam.classConfigs[selectedClass].subjects;
      const entries = Object.entries(subsObj);
      if (entries.length > 0) {
        return entries
          .sort(([, a]: any, [, b]: any) => (a.order || 99) - (b.order || 99))
          .map(([subId, sub]: any) => ({
            subjectId: subId,
            subjectName: sub.name || subId,
            date: sub.date || '',
            reportingTime: sub.reportingTime || '08:30 AM',
            startTime: sub.startTime || '09:00 AM'
          }));
      }
    }

    // 2. Try other exams (e.g. First Term)
    for (const otherExam of exams) {
      if (otherExam.id !== selectedExamId && otherExam.classConfigs?.[selectedClass]?.subjects) {
        const subsObj = otherExam.classConfigs[selectedClass].subjects;
        const entries = Object.entries(subsObj);
        if (entries.length > 0) {
          return entries
            .sort(([, a]: any, [, b]: any) => (a.order || 99) - (b.order || 99))
            .map(([subId, sub]: any) => ({
              subjectId: subId,
              subjectName: sub.name || subId,
              date: '',
              reportingTime: sub.reportingTime || '08:30 AM',
              startTime: sub.startTime || '09:00 AM'
            }));
        }
      }
    }

    // 3. Try settings.subjects
    if (settings?.subjects?.length) {
      const classSubjects = settings.subjects.filter(s => 
        !s.appliesTo?.length || s.appliesTo.some(c => c === selectedClass || selectedClass.includes(c))
      );
      if (classSubjects.length > 0) {
        return classSubjects.map((s) => ({
          subjectId: s.id,
          subjectName: s.name,
          date: '',
          reportingTime: '08:30 AM',
          startTime: '09:00 AM'
        }));
      }
    }

    return [];
  };

  useEffect(() => {
    if (savedDateSheet && savedDateSheet.papers && savedDateSheet.papers.length > 0) {
      setExamTitle(savedDateSheet.examTitle || selectedExam?.title || "Examination 2026");
      // Repair any paper where subjectName might be blank
      const repaired = savedDateSheet.papers.map(p => {
        if (!p.subjectName || p.subjectName.trim() === '') {
          const fromCurrent = selectedExam?.classConfigs?.[selectedClass]?.subjects?.[p.subjectId];
          const fromOther = exams.find(e => e.classConfigs?.[selectedClass]?.subjects?.[p.subjectId])
            ?.classConfigs?.[selectedClass]?.subjects?.[p.subjectId];
          const fromSettings = settings?.subjects?.find(s => s.id === p.subjectId);
          return {
            ...p,
            subjectName: fromCurrent?.name || fromOther?.name || fromSettings?.name || p.subjectId
          };
        }
        return p;
      });
      setPapers(repaired);
    } else if (isWorkspaceActive && selectedClass) {
      // Automatically load cloned or previous term subjects so the table is NEVER empty!
      loadClonedOrPreviousPapers().then(inheritedPapers => {
        setExamTitle(selectedExam?.title || "Examination 2026");
        if (inheritedPapers.length > 0) {
          setPapers(inheritedPapers);
        }
      });
    }
  }, [savedDateSheet, selectedClass, isWorkspaceActive, selectedExam, exams]);

  const handleCopyFromPrevious = async () => {
    const inherited = await loadClonedOrPreviousPapers();
    if (inherited.length > 0) {
      setPapers(inherited);
      toast({
        title: "Subjects Inherited",
        description: `Successfully loaded ${inherited.length} subjects from curriculum setup.`,
      });
    } else {
      toast({
        title: "No Previous Subjects Found",
        description: "Please use 'Add Subject Row' to configure subjects.",
        variant: "destructive"
      });
    }
  };

  const processedStudents = useMemo(() => {
    if (!students) return [];
    return [...students]
      .filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNumber.includes(searchTerm);
        const matchesCorridor = selectedCorridor === "all" || s.corridor === selectedCorridor;
        return matchesSearch && matchesCorridor;
      })
      .sort((a, b) => parseInt(a.rollNumber) - parseInt(b.rollNumber));
  }, [students, searchTerm, selectedCorridor]);

  const activeStudents = useMemo(() => processedStudents.filter(s => !excludedIds.has(s.id)), [processedStudents, excludedIds]);

  /**
   * Smart Auto-Schedule Engine
   * Generates consecutive dates starting from bulkStartDate (e.g. in Nov/Dec), skipping Sundays.
   */
  const handleAutoSchedule = () => {
    if (!bulkStartDate) {
      toast({ 
        title: "Start Date Required", 
        description: "Please pick an exam commencement date (e.g. in September, October, November or December) to auto-generate the timetable.", 
        variant: "destructive" 
      });
      return;
    }

    if (papers.length === 0) {
      toast({ title: "No Subjects", description: "Add subjects to the timetable before auto-assigning dates.", variant: "destructive" });
      return;
    }

    const parts = bulkStartDate.split('-');
    let curYear = parseInt(parts[0]);
    let curMonth = parseInt(parts[1]) - 1;
    let curDay = parseInt(parts[2]);
    let cur = new Date(curYear, curMonth, curDay);

    const updated = papers.map((p) => {
      // If Sunday (0) and skipSundays is active, advance to Monday
      if (skipSundays && cur.getDay() === 0) {
        cur.setDate(cur.getDate() + 1);
      }
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const formatted = `${y}-${m}-${d}`;
      
      // Advance to next day for subsequent paper
      cur.setDate(cur.getDate() + 1);

      return {
        ...p,
        date: formatted,
        reportingTime: p.reportingTime || '08:30 AM',
        startTime: p.startTime || '09:00 AM'
      };
    });

    setPapers(updated);
    toast({
      title: "Timetable Auto-Scheduled",
      description: `Assigned sequential dates for ${updated.length} subjects starting from ${bulkStartDate}.`,
    });
  };

  const handleApplyUniformTimes = (reporting = "08:30 AM", start = "09:00 AM") => {
    const updated = papers.map(p => ({
      ...p,
      reportingTime: reporting,
      startTime: start
    }));
    setPapers(updated);
    toast({
      title: "Uniform Timings Applied",
      description: `All papers updated to Reporting: ${reporting}, Start: ${start}.`
    });
  };

  const handleSaveSchedule = async () => {
    if (!selectedClass || !selectedSection || !dateSheetId) return;
    setSavingSchedule(true);
    try {
      const data: Partial<DateSheet> & { id: string } = {
        id: dateSheetId,
        examTitle,
        className: selectedClass,
        sectionName: selectedSection,
        papers
      };

      // 1. Save exam-specific date sheet in Supabase
      await upsertDateSheet(data);

      // 2. Mirror to Supabase exam classConfigs
      if (selectedExam) {
        const classCfg = selectedExam.classConfigs?.[selectedClass] || { subjects: {} };
        const updatedSubjects = { ...(classCfg.subjects || {}) };
        papers.forEach((p, idx) => {
          if (p.subjectId) {
            updatedSubjects[p.subjectId] = {
              ...(updatedSubjects[p.subjectId] || {}),
              name: p.subjectName,
              date: p.date,
              reportingTime: p.reportingTime,
              startTime: p.startTime,
              order: idx + 1
            };
          }
        });
        const updatedConfigs = {
          ...(selectedExam.classConfigs || {}),
          [selectedClass]: { ...classCfg, subjects: updatedSubjects }
        };
        await updateExamClassConfigs(selectedExam.id, updatedConfigs);
      }

      toast({ 
        title: "Schedule Committed & Synchronized", 
        description: `Timetable for ${selectedClass} (${selectedSection}) saved for ${examTitle}.` 
      });
    } catch (e) {
      console.error(e);
      toast({ title: "Save Failed", variant: "destructive" });
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleReset = () => {
    setIsWorkspaceActive(false);
    setSelectedClass("");
    setSelectedSection("");
    setPapers([]);
  };

  const addPaperRow = () => {
    const newId = `sub_${Date.now()}_${papers.length + 1}`;
    setPapers(prev => [
      ...prev, 
      { subjectId: newId, subjectName: '', date: '', reportingTime: '08:30 AM', startTime: '09:00 AM' }
    ]);
  };

  const updatePaper = (index: number, field: keyof typeof papers[0], value: string) => {
    setPapers(prev => {
      const next = [...prev];
      if (index >= 0 && index < next.length) {
        next[index] = { ...next[index], [field]: value };
        if (field === 'subjectName' && !next[index].subjectId) {
          next[index].subjectId = `sub_${Date.now()}_${index + 1}`;
        }
      }
      return next;
    });
  };

  const removePaper = (index: number) => {
    setPapers(papers.filter((_, i) => i !== index));
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-32 px-4 sm:px-0 font-inter">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-navy-900 dark:text-white font-outfit uppercase">
            Roll Number Slips & Date Sheets
          </h1>
          <p className="text-muted-foreground font-medium text-xs sm:text-sm mt-1">
            Configure examination schedules per term and generate high-fidelity roll number slips.
          </p>
        </div>
        {!isWorkspaceActive && (
          <Button variant="ghost" className="rounded-xl font-bold gap-2 text-slate-400 dark:text-slate-500 text-xs" asChild>
            <Link href="/admin/dashboard"><ChevronLeft className="h-4 w-4" /> Back to Hub</Link>
          </Button>
        )}
      </header>

      <AnimatePresence mode="wait">
        {!isWorkspaceActive ? (
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid gap-6"
          >
            <Card className="border-none shadow-card rounded-[2.5rem] overflow-hidden bg-white dark:bg-card">
              <CardHeader className="bg-navy-900 text-white p-10 text-center">
                 <div className="h-20 w-20 rounded-[2rem] bg-white/10 flex items-center justify-center backdrop-blur-md mx-auto mb-6 border border-white/20">
                   <Printer className="h-10 w-10 text-white" />
                 </div>
                 <CardTitle className="text-3xl font-outfit uppercase font-black">Initialize Slip Batch</CardTitle>
                 <CardDescription className="text-white/60 text-sm mt-2">
                   Select the examination cycle and class group to configure timetable and print slips.
                 </CardDescription>
              </CardHeader>
              <CardContent className="p-8 sm:p-10 grid gap-6 max-w-2xl mx-auto w-full">
                 {/* 1. Examination Cycle Selector */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] ml-1">
                      1. Target Examination Cycle
                    </label>
                    <Select 
                      value={selectedExamId} 
                      onValueChange={(val) => { 
                        setSelectedExamId(val);
                        setActiveExamId(val);
                        const match = exams.find(e => e.id === val);
                        if (match) {
                          setExamTitle(match.title);
                          if (match.startDate) {
                            setBulkStartDate(match.startDate.split('T')[0]);
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-navy-950 border-none font-bold text-base dark:text-white shadow-inner">
                        <SelectValue placeholder="Choose Examination Term" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl dark:bg-card dark:border-white/5">
                        {exams.map(e => (
                          <SelectItem key={e.id} value={e.id} className="font-bold py-3 dark:text-white">
                            {e.title} {e.id === activeExamId ? '⭐ (Active Term)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>

                 {/* 2. Grade and Section Selector */}
                 <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] ml-1">
                         2. Academic Grade
                       </label>
                       <Select value={selectedClass} onValueChange={(val) => { setSelectedClass(val); setSelectedSection(""); }}>
                          <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-navy-950 border-none font-bold text-base dark:text-white shadow-inner">
                             <SelectValue placeholder="Choose Class" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl dark:bg-card dark:border-white/5">
                             {settings?.classes?.map(c => <SelectItem key={c} value={c} className="font-bold py-3 dark:text-white">{c}</SelectItem>)}
                          </SelectContent>
                       </Select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] ml-1">
                         3. Target Section
                       </label>
                       <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                          <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-navy-950 border-none font-bold text-base dark:text-white shadow-inner">
                             <SelectValue placeholder="Select Group" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl dark:bg-card dark:border-white/5">
                             {availableSections.map(s => <SelectItem key={s} value={s} className="font-bold py-3 dark:text-white">Section {s}</SelectItem>)}
                          </SelectContent>
                       </Select>
                    </div>
                 </div>

                 <Button 
                    onClick={() => setIsWorkspaceActive(true)}
                    disabled={!selectedClass || !selectedSection || !selectedExamId}
                    className="h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 group text-xs mt-2"
                 >
                    Launch Timetable Workspace
                    <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                 </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="workspace"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <Card className="border-none shadow-card rounded-[2rem] overflow-hidden bg-white dark:bg-card">
              <CardHeader className="bg-navy-900 text-white p-7 sm:p-8">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg shrink-0">
                        <Layers className="h-6 w-6 text-white" />
                      </div>
                      <div>
                         <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge className="bg-primary-500/20 text-primary-300 border-none font-black text-[9px] uppercase px-2 h-4 tracking-wider">
                              {selectedExam?.title || 'Cycle Active'}
                            </Badge>
                            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                              Schedule Manager
                            </span>
                         </div>
                         <CardTitle className="text-xl sm:text-2xl font-outfit uppercase font-black">
                           Grade {selectedClass} — Section {selectedSection}
                         </CardTitle>
                      </div>
                   </div>
                   <Button variant="outline" onClick={handleReset} className="rounded-xl border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold gap-2 text-xs">
                      <RotateCcw className="h-3.5 w-3.5" />
                      Switch Class / Term
                   </Button>
                 </div>
              </CardHeader>
              
              <Tabs defaultValue="schedule" className="w-full">
                 <TabsList className="w-full bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 p-0 rounded-none h-14 justify-start px-8">
                    <TabsTrigger value="schedule" className="h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary-600 font-black text-xs uppercase tracking-widest gap-2 dark:text-slate-400 dark:data-[state=active]:text-white">
                       <Calendar className="h-4 w-4" /> 1. Define Timetable
                    </TabsTrigger>
                    <TabsTrigger value="students" className="h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary-600 font-black text-xs uppercase tracking-widest gap-2 dark:text-slate-400 dark:data-[state=active]:text-white">
                       <Users className="h-4 w-4" /> 2. Print Batch Slips
                    </TabsTrigger>
                 </TabsList>

                 <TabsContent value="schedule" className="m-0 p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1 tracking-[0.2em]">Institutional Exam Title</label>
                        <Input 
                          value={examTitle} 
                          onChange={e => setExamTitle(e.target.value)}
                          placeholder="e.g. Second Term Examination 2026"
                          className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border border-border px-4 font-bold text-base dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Streamlined Timetable Helper Toolbar */}
                    <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs font-black uppercase text-navy-900 dark:text-white font-outfit">
                            Exam Start Date & Auto-Scheduler
                          </span>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            Set commencement date to auto-assign sequential dates across all subjects.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date:</span>
                          <Input 
                            type="date" 
                            value={bulkStartDate} 
                            onChange={e => setBulkStartDate(e.target.value)} 
                            className="h-9 w-36 bg-white dark:bg-navy-950 border border-border rounded-xl text-xs font-bold"
                          />
                        </div>

                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none bg-white dark:bg-navy-950 px-2.5 py-1.5 rounded-xl border border-border">
                          <Checkbox checked={skipSundays} onCheckedChange={(c) => setSkipSundays(!!c)} className="h-3.5 w-3.5" />
                          <span>Skip Sun</span>
                        </label>

                        <Button 
                          type="button"
                          onClick={handleAutoSchedule}
                          className="h-9 px-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Auto-Fill Dates
                        </Button>

                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => handleApplyUniformTimes("08:30 AM", "09:00 AM")}
                          className="h-9 px-2.5 rounded-xl border-border font-bold text-xs gap-1 text-slate-600 dark:text-slate-300 hover:text-foreground"
                        >
                          <Clock className="h-3.5 w-3.5 text-primary-600" />
                          08:30 / 09:00 AM
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2 flex-wrap gap-2">
                         <h3 className="text-xs font-black uppercase tracking-widest text-navy-900 dark:text-white font-outfit">
                           Papers & Schedule Matrix ({papers.length} Subjects)
                         </h3>
                         <div className="flex items-center gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={handleCopyFromPrevious} 
                              className="rounded-xl h-9 px-3 gap-1.5 border-border font-bold text-xs hover:bg-muted text-foreground"
                            >
                              <Copy className="h-3.5 w-3.5 text-primary-600" /> Auto-Load Subjects
                            </Button>
                            <Button onClick={addPaperRow} className="rounded-xl h-9 px-4 gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs uppercase text-white shadow-sm">
                               <Plus className="h-3.5 w-3.5" /> Add Subject Row
                            </Button>
                         </div>
                      </div>

                      <div className="overflow-hidden border border-slate-100 dark:border-white/5 rounded-2xl bg-white dark:bg-card shadow-sm">
                         <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-white/10 border-b border-slate-100 dark:border-white/5">
                               <tr>
                                  <th className="p-3.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[220px]">
                                    Subject Name
                                  </th>
                                  <th className="p-3.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[150px]">
                                    Paper Date
                                  </th>
                                  <th className="p-3.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[120px]">
                                    Reporting Time
                                  </th>
                                  <th className="p-3.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest min-w-[120px]">
                                    Start Time
                                  </th>
                                  <th className="p-3.5 w-14"></th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                               {papers.map((paper, idx) => (
                                 <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-2.5">
                                       <div className="relative flex items-center">
                                          <Input 
                                             value={paper.subjectName || ''} 
                                             onChange={e => updatePaper(idx, 'subjectName', e.target.value)} 
                                             placeholder="e.g. English A" 
                                             className="h-10 font-bold text-xs uppercase bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 pr-8 text-navy-900 dark:text-white"
                                          />
                                          {availableSubjectOptions.length > 0 && (
                                             <div className="absolute right-1">
                                                <Select 
                                                   value={paper.subjectId || ''} 
                                                   onValueChange={v => {
                                                      const found = availableSubjectOptions.find(o => o.id === v);
                                                      if (found) {
                                                         updatePaper(idx, 'subjectId', found.id);
                                                         updatePaper(idx, 'subjectName', found.name);
                                                      }
                                                   }}
                                                >
                                                   <SelectTrigger className="h-8 w-7 border-none bg-transparent hover:bg-slate-200/60 dark:hover:bg-white/10 p-0 flex items-center justify-center text-slate-400">
                                                      <span className="sr-only">Choose preset subject</span>
                                                   </SelectTrigger>
                                                   <SelectContent className="dark:bg-card dark:border-white/10 rounded-xl">
                                                      {availableSubjectOptions.map(opt => (
                                                         <SelectItem key={opt.id} value={opt.id} className="text-xs font-bold dark:text-white">
                                                            {opt.name}
                                                         </SelectItem>
                                                      ))}
                                                   </SelectContent>
                                                </Select>
                                             </div>
                                          )}
                                       </div>
                                    </td>
                                    <td className="p-2.5">
                                       <Input 
                                         type="date" 
                                         value={paper.date || ''} 
                                         onChange={e => updatePaper(idx, 'date', e.target.value)} 
                                         className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 h-10 font-bold dark:text-white focus:ring-0 text-xs rounded-xl px-3" 
                                       />
                                    </td>
                                    <td className="p-2.5">
                                       <Input 
                                         placeholder="08:30 AM" 
                                         value={paper.reportingTime || ''} 
                                         onChange={e => updatePaper(idx, 'reportingTime', e.target.value)} 
                                         className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 h-10 font-bold dark:text-white focus:ring-0 text-xs rounded-xl px-3" 
                                       />
                                    </td>
                                    <td className="p-2.5">
                                       <Input 
                                         placeholder="09:00 AM" 
                                         value={paper.startTime || ''} 
                                         onChange={e => updatePaper(idx, 'startTime', e.target.value)} 
                                         className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 h-10 font-bold dark:text-white focus:ring-0 text-xs rounded-xl px-3" 
                                       />
                                    </td>
                                    <td className="p-2.5 text-right">
                                       <Button variant="ghost" size="icon" onClick={() => removePaper(idx)} className="h-8 w-8 text-rose-400 hover:text-rose-600 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
                                    </td>
                                 </tr>
                               ))}
                               {papers.length === 0 && (
                                 <tr>
                                    <td colSpan={5} className="p-12 text-center space-y-2">
                                      <p className="text-slate-400 font-bold text-xs">No subjects loaded in timetable.</p>
                                      <Button 
                                        type="button" 
                                        onClick={handleCopyFromPrevious} 
                                        className="rounded-xl h-9 px-4 gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-sm mt-2"
                                      >
                                        <Copy className="h-3.5 w-3.5" /> Auto-Load Cloned Subjects
                                      </Button>
                                    </td>
                                 </tr>
                               )}
                            </tbody>
                         </table>
                      </div>
                   </div>

                   <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-white/5">
                      <Button 
                        onClick={handleSaveSchedule} 
                        disabled={savingSchedule || papers.length === 0}
                        className="rounded-xl h-11 px-8 gap-2 bg-navy-900 hover:bg-navy-800 dark:bg-primary-600 dark:hover:bg-primary-700 shadow-md font-bold text-white uppercase tracking-wider text-xs"
                      >
                         {savingSchedule ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                         Commit Section Timetable
                      </Button>
                   </div>
                 </TabsContent>

                 <TabsContent value="students" className="m-0 p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                       <div className="flex items-center gap-3 flex-1 flex-wrap">
                          <div className="relative flex-1 max-w-sm min-w-[200px]">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                              placeholder="Search student or roll number..." 
                              className="h-10 pl-10 rounded-xl bg-slate-50 dark:bg-navy-950 border border-border font-medium dark:text-white text-xs" 
                              value={searchTerm} 
                              onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                          </div>
                          <Select value={selectedCorridor} onValueChange={setSelectedCorridor}>
                            <SelectTrigger className="w-44 h-10 rounded-xl bg-slate-50 dark:bg-navy-950 border border-border font-bold text-[10px] uppercase tracking-wider dark:text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-card dark:border-white/5 rounded-xl">
                              <SelectItem value="all" className="dark:text-white font-bold text-xs">Global Zone</SelectItem>
                              <SelectItem value="Corridor A" className="dark:text-white font-bold text-xs">Zone A</SelectItem>
                              <SelectItem value="Corridor B" className="dark:text-white font-bold text-xs">Zone B</SelectItem>
                              <SelectItem value="Corridor C" className="dark:text-white font-bold text-xs">Zone C</SelectItem>
                            </SelectContent>
                          </Select>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="hidden lg:flex flex-col items-end">
                             <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Selected Students</p>
                             <p className="text-base font-black text-navy-900 dark:text-white leading-none">{activeStudents.length}</p>
                          </div>
                          <PrintButton 
                            type="rollSlip" 
                            data={{ 
                              examId: selectedExamId,
                              classId: selectedClass,
                              sectionId: selectedSection,
                              studentIds: activeStudents.map(s => s.id)
                            }} 
                            label="Batch Print Slips" 
                            className="rounded-xl h-11 px-7 bg-primary-600 hover:bg-primary-700 text-white font-bold uppercase tracking-wider text-xs shadow-md" 
                            icon={<FileDown className="h-4 w-4" />} 
                          />
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center justify-between px-5 bg-slate-50/50 dark:bg-white/5 py-3 rounded-xl border border-slate-100 dark:border-white/5">
                          <div className="flex items-center gap-2">
                             <Users className="h-4 w-4 text-primary-600" />
                             <span className="text-[10px] font-black text-navy-900 dark:text-white uppercase tracking-widest">
                               Enrollment Manifest ({selectedClass} - {selectedSection})
                             </span>
                          </div>
                          <div className="flex gap-4">
                             <button onClick={() => setExcludedIds(new Set())} className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase hover:underline tracking-tight">Select All</button>
                             <button onClick={() => setExcludedIds(new Set(processedStudents.map(s => s.id)))} className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase hover:underline tracking-tight">Deselect All</button>
                          </div>
                       </div>
                       
                       <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {studentsLoading ? (
                            <div className="col-span-full py-16 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" /></div>
                          ) : processedStudents.length === 0 ? (
                            <div className="col-span-full py-16 text-center text-slate-400 uppercase font-black text-xs tracking-widest opacity-40">No matching students in section</div>
                          ) : (
                            processedStudents.map((student) => {
                              const isExcluded = excludedIds.has(student.id);
                              return (
                                <motion.div 
                                  key={student.id} 
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  onClick={() => {
                                     const next = new Set(excludedIds);
                                     if (next.has(student.id)) next.delete(student.id);
                                     else next.add(student.id);
                                     setExcludedIds(next);
                                  }}
                                  className={cn(
                                    "p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 relative group overflow-hidden",
                                    isExcluded 
                                      ? "bg-slate-50 dark:bg-white/5 border-transparent opacity-40 grayscale" 
                                      : "bg-white dark:bg-navy-950 border-slate-100 dark:border-white/10 hover:border-primary-100 dark:hover:border-primary-900 shadow-sm"
                                  )}
                                >
                                   <div className={cn(
                                      "h-10 w-10 rounded-xl flex items-center justify-center text-sm font-black transition-all",
                                      isExcluded ? "bg-slate-200 text-slate-400" : "bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 group-hover:scale-105"
                                   )}>
                                      {student.rollNumber}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                      <p className="font-bold text-navy-900 dark:text-white leading-tight mb-0.5 text-sm truncate">{student.name}</p>
                                      <div className="flex items-center gap-1.5">
                                         <Badge variant="outline" className="text-[7.5px] font-black uppercase bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-none h-3.5 px-1">{student.corridor}</Badge>
                                         <span className="text-[8.5px] font-medium text-slate-400 italic">Verified ID</span>
                                      </div>
                                   </div>
                                   <Checkbox checked={!isExcluded} onCheckedChange={() => {}} className="rounded-full h-4 w-4 border-2" />
                                </motion.div>
                              );
                            })
                          )}
                       </div>
                    </div>
                 </TabsContent>
              </Tabs>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
