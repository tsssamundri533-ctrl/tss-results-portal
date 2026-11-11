'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  ChevronRight,
  Loader2, 
  Search, 
  Calculator,
  Trophy,
  Printer,
  FileText,
  BarChart3,
  ArrowDownUp,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Save,
  Eye,
  FileSpreadsheet,
  Check,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSchoolStore } from '@/store/use-school-store';
import { useExamStore } from '@/store/use-exam-store';
import { useSchoolSettings } from '@/hooks/use-school-settings';
import { PrintButton } from '@/components/print/PrintButton';
import Link from 'next/link';
import { Student, Exam, Mark, Result } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  getExams, 
  getStudents, 
  getMarks, 
  getResults, 
  saveResultsBatch,
  getExamSummary,
  ClassExamSummary,
  updateExamClassConfigs
} from '@/lib/supabase-service';

const DEFAULT_SCALE = [
  { grade: 'A+', min: 90, label: 'Outstanding', remark: 'Truly exceptional academic performance and dedication.' },
  { grade: 'A', min: 80, label: 'Excellent', remark: 'Highly commendable results.' },
  { grade: 'B', min: 70, label: 'Very Good', remark: 'Solid and consistent performance.' },
  { grade: 'C', min: 60, label: 'Good', remark: 'Satisfactory results. Strive for better.' },
  { grade: 'D', min: 50, label: 'Average', remark: 'Hard work is required to improve.' },
  { grade: 'F', min: 0, label: 'Fail', remark: 'Urgent attention and revision required.' },
];

export default function AdminResultsPortal() {
  useSchoolSettings();
  const { settings } = useSchoolStore();
  const { activeExamId, setActiveExamId } = useExamStore();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Multi-term print format selection
  const [printFormat, setPrintFormat] = useState<'single' | 'combined'>('single');

  // Tab 1: Summary state
  const [summaries, setSummaries] = useState<ClassExamSummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Tab 2: Gazette state
  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [marksData, setMarksData] = useState<Mark[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [computing, setComputing] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Tab 3: Sequence Protocol state
  const [sequenceClass, setSequenceClass] = useState("");
  const [orderedSubjects, setOrderedSubjects] = useState<{ id: string; name: string; maxMarks: number; order: number }[]>([]);
  const [savingSequence, setSavingSequence] = useState(false);

  // Initial load
  useEffect(() => {
    setMounted(true);
    async function loadExams() {
      const examList = await getExams();
      setExams(examList);
      if (examList.length > 0) {
        const preferredId = (activeExamId && examList.some(e => e.id === activeExamId))
          ? activeExamId
          : examList[0].id;
        setSelectedExam(preferredId);
        setActiveExamId(preferredId);
      }
    }
    loadExams();
  }, []);

  // Synchronize when activeExamId changes externally via TopBar
  useEffect(() => {
    if (activeExamId && activeExamId !== selectedExam && exams.some(e => e.id === activeExamId)) {
      setSelectedExam(activeExamId);
    }
  }, [activeExamId, exams, selectedExam]);

  const currentExam = useMemo(() => {
    return exams.find(e => e.id === selectedExam) || null;
  }, [exams, selectedExam]);

  // Secondary exam if multiple exams exist
  const secondaryExam = useMemo(() => {
    return exams.find(e => e.id !== selectedExam) || null;
  }, [exams, selectedExam]);

  // Load Tab 1 Summary data whenever Exam changes
  useEffect(() => {
    if (!selectedExam || !settings?.classes) return;

    async function loadSummary() {
      setSummaryLoading(true);
      try {
        const sum = await getExamSummary(
          selectedExam, 
          settings?.classes || [], 
          currentExam?.classConfigs || {}
        );
        setSummaries(sum);
      } catch (err) {
        console.error('Error loading exam summary:', err);
      } finally {
        setSummaryLoading(false);
      }
    }

    loadSummary();
  }, [selectedExam, settings?.classes, currentExam]);

  // Fetch students, marks, and results when Exam or Class changes for Tab 2
  useEffect(() => {
    if (!selectedClass || !selectedExam) {
      setStudents([]);
      setResults([]);
      setMarksData([]);
      setSelectedStudentIds(new Set());
      return;
    }

    async function loadClassData() {
      setDataLoading(true);
      try {
        const [stList, resList, mList] = await Promise.all([
          getStudents(selectedClass),
          getResults(selectedExam, selectedClass),
          getMarks(selectedExam, selectedClass)
        ]);
        setStudents(stList);
        setResults(resList);
        setMarksData(mList);
        setSelectedStudentIds(new Set());
      } catch (err) {
        console.error('Error fetching class results data:', err);
      } finally {
        setDataLoading(false);
      }
    }

    loadClassData();
  }, [selectedExam, selectedClass]);

  // Available sections for the selected class
  const availableSections = useMemo(() => {
    if (!selectedClass) return [];
    if (settings?.classSections?.[selectedClass]?.length) {
      return settings.classSections[selectedClass];
    }
    const studentSections = Array.from(new Set(students.map(s => s.section).filter(Boolean)));
    if (studentSections.length > 0) return studentSections;
    if (settings?.sections?.length) return settings.sections;
    return ['A', 'B'];
  }, [settings, selectedClass, students]);

  // Filter students by section & search query
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students
      .filter(s => {
        const matchesSection = selectedSection === 'ALL' || s.section === selectedSection;
        const matchesSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (s.rollNumber || '').includes(searchTerm);
        return matchesSection && matchesSearch;
      })
      .sort((a, b) => parseInt(a.rollNumber) - parseInt(b.rollNumber));
  }, [students, selectedSection, searchTerm]);

  // Filter computed results matching filtered students
  const studentsWithResults = useMemo(() => {
    if (!results || !filteredStudents) return [];
    return filteredStudents.filter(s => results.some(r => r.studentId === s.id));
  }, [results, filteredStudents]);

  // Quick statistics for current class/section
  const classStats = useMemo(() => {
    const ready = studentsWithResults.map(s => results.find(r => r.studentId === s.id)!);
    const total = ready.length;
    if (total === 0) return { total: 0, passed: 0, failed: 0, avgPct: 0 };
    const passed = ready.filter(r => r.status === 'Pass').length;
    const failed = total - passed;
    const avgPct = Math.round(ready.reduce((acc, r) => acc + (r.percentage || 0), 0) / total);
    return { total, passed, failed, avgPct };
  }, [studentsWithResults, results]);

  const toggleSelectAll = () => {
    if (selectedStudentIds.size === studentsWithResults.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(studentsWithResults.map(s => s.id)));
    }
  };

  const toggleStudentSelection = (id: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStudentIds(next);
  };

  // Compute Results for Class
  const handleComputeResults = async (targetClassName = selectedClass) => {
    if (!selectedExam || !targetClassName || !settings) return;
    setComputing(true);
    try {
      const exam = exams.find(e => e.id === selectedExam);
      if (!exam) throw new Error("Exam config missing");
      
      const classConfig = exam.classConfigs?.[targetClassName];
      if (!classConfig || !classConfig.subjects) {
        toast({ 
          title: "Configuration Missing", 
          description: `No subjects configured for ${targetClassName} in this exam.`, 
          variant: "destructive" 
        });
        return;
      }

      const [classStudents, classMarks] = await Promise.all([
        getStudents(targetClassName),
        getMarks(selectedExam, targetClassName)
      ]);

      if (classStudents.length === 0) {
        toast({ title: "No Students Found", description: `No active students enrolled in ${targetClassName}.` });
        return;
      }

      const scale = (settings.gradingScale && settings.gradingScale.length > 0) 
        ? settings.gradingScale 
        : DEFAULT_SCALE;
      
      const sortedScale = [...scale].sort((a, b) => b.min - a.min);

      const getGradeInfo = (pct: number) => {
        for (const entry of sortedScale) {
          if (pct >= entry.min) return entry;
        }
        return sortedScale[sortedScale.length - 1] || { grade: 'F', remark: 'Needs Improvement' };
      };

      const computedResults: Result[] = [];
      
      classStudents.forEach(student => {
        const studentMarks = classMarks.filter(m => m.studentId === student.id);
        let obtained = 0, totalMax = 0;
        const subjectsResult: Record<string, any> = {};

        Object.entries(classConfig.subjects).forEach(([subId, subData]) => {
          const markEntry = studentMarks.find(m => m.subjectId === subId);
          const mark = markEntry?.marks || 0;
          
          obtained += mark;
          totalMax += subData.maxMarks;
          
          const subPct = subData.maxMarks > 0 ? (mark / subData.maxMarks) * 100 : 0;
          const subGradeInfo = getGradeInfo(subPct);

          subjectsResult[subId] = { 
            name: subData.name, 
            marks: mark, 
            maxMarks: subData.maxMarks, 
            grade: subGradeInfo.grade,
            order: (subData as any).order ?? 99
          }; 
        });

        const overallPercentage = totalMax > 0 ? Math.round((obtained / totalMax) * 100) : 0;
        const finalGradeInfo = getGradeInfo(overallPercentage);

        computedResults.push({
          id: `${selectedExam}_${student.id}`,
          studentId: student.id, 
          studentName: student.name, 
          rollNumber: student.rollNumber,
          className: student.class, 
          sectionName: student.section,
          gender: student.gender || 'male',
          photoURL: student.photoURL || '',
          examId: selectedExam, 
          schoolId: 'tss-main-school', 
          totalObtained: obtained,
          totalMax, 
          percentage: overallPercentage, 
          grade: finalGradeInfo.grade, 
          status: overallPercentage >= (exam.passPercentage || 33) ? 'Pass' : 'Fail',
          remarks: finalGradeInfo.remark || "Performance Synchronized.",
          subjects: subjectsResult, 
          computedAt: new Date().toISOString()
        });
      });

      const success = await saveResultsBatch(computedResults);
      if (success) {
        if (targetClassName === selectedClass) {
          setResults(computedResults);
        }
        const sum = await getExamSummary(selectedExam, settings?.classes || [], exam.classConfigs || {});
        setSummaries(sum);
        toast({ 
          title: "Computation Successful", 
          description: `Processed and saved ${computedResults.length} student results for ${targetClassName}.` 
        });
      } else {
        throw new Error("Failed to save computed results to Supabase");
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Computation Failed", variant: "destructive" });
    } finally {
      setComputing(false);
    }
  };

  const handleOpenInGazette = (className: string) => {
    setSelectedClass(className);
    setSelectedSection("ALL");
    setActiveTab("gazette");
  };

  // Tab 3: Sequence Protocol setup
  useEffect(() => {
    if (!sequenceClass && settings?.classes && settings.classes.length > 0) {
      setSequenceClass(settings.classes[0]);
    }
  }, [settings?.classes, sequenceClass]);

  useEffect(() => {
    if (!sequenceClass || !currentExam?.classConfigs?.[sequenceClass]?.subjects) {
      setOrderedSubjects([]);
      return;
    }

    const subsMap = currentExam.classConfigs[sequenceClass].subjects;
    const list = Object.entries(subsMap).map(([id, data]: [string, any]) => ({
      id,
      name: data.name,
      maxMarks: data.maxMarks,
      order: data.order ?? 99
    })).sort((a, b) => a.order - b.order);

    setOrderedSubjects(list);
  }, [sequenceClass, currentExam]);

  const moveSubject = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedSubjects.length) return;

    const next = [...orderedSubjects];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;

    const reindexed = next.map((item, idx) => ({ ...item, order: idx + 1 }));
    setOrderedSubjects(reindexed);
  };

  const handleSaveSequence = async () => {
    if (!selectedExam || !sequenceClass || !currentExam) return;
    setSavingSequence(true);
    try {
      const updatedClassConfigs = JSON.parse(JSON.stringify(currentExam.classConfigs || {}));
      if (!updatedClassConfigs[sequenceClass]) {
        updatedClassConfigs[sequenceClass] = { subjects: {} };
      }

      orderedSubjects.forEach((item, idx) => {
        if (updatedClassConfigs[sequenceClass].subjects[item.id]) {
          updatedClassConfigs[sequenceClass].subjects[item.id].order = idx + 1;
        }
      });

      const ok = await updateExamClassConfigs(selectedExam, updatedClassConfigs);
      if (ok) {
        setExams(prev => prev.map(e => e.id === selectedExam ? { ...e, classConfigs: updatedClassConfigs } : e));
        toast({ 
          title: "Sequence Protocol Saved", 
          description: `Updated subject order for ${sequenceClass}. Result cards will now print in this order.` 
        });
      } else {
        throw new Error("Failed to save sequence to database");
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Save Failed", variant: "destructive" });
    } finally {
      setSavingSequence(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-24 px-4 sm:px-0 font-inter">
      {/* Top Header & Assessment Cycle Selection */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3 md:mt-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-foreground font-outfit uppercase">
            Examination Results Portal
          </h1>
          <p className="text-muted-foreground text-xs font-semibold">
            Institutional result compilation, marks gazette, and verified report cards.
          </p>
        </div>

        {/* Global Exam Selector */}
        <div className="w-full sm:w-64">
          <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1 block mb-1">
            Assessment Cycle
          </label>
          <Select 
            value={selectedExam} 
            onValueChange={(val) => { 
              setSelectedExam(val); 
              setActiveExamId(val); 
            }}
          >
            <SelectTrigger className="h-10 rounded-xl bg-card border border-border font-bold text-xs text-foreground shadow-sm">
              <SelectValue placeholder="Choose Exam" />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-popover text-popover-foreground border-border">
              {exams.map(e => (
                <SelectItem key={e.id} value={e.id} className="font-bold text-xs">
                  {e.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Main 3 Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full h-11 bg-muted/60 p-1 rounded-xl border border-border">
          <TabsTrigger 
            value="summary" 
            className="rounded-lg font-black text-xs uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-primary-600" />
            <span>Summary</span>
          </TabsTrigger>
          <TabsTrigger 
            value="gazette" 
            className="rounded-lg font-black text-xs uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Class Gazette</span>
          </TabsTrigger>
          <TabsTrigger 
            value="sequence" 
            className="rounded-lg font-black text-xs uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-1.5"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sequence Protocol</span>
          </TabsTrigger>
        </TabsList>

        {/* ==================================================================== */}
        {/* TAB 1: SUMMARY                                                       */}
        {/* ==================================================================== */}
        <TabsContent value="summary" className="mt-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black font-outfit uppercase text-foreground">Institutional Readiness Overview</h2>
              <p className="text-xs text-muted-foreground font-medium">Class-by-class marks completion and result compilation status.</p>
            </div>
            <Badge className="bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 px-2.5 py-0.5 text-[10px] font-bold">
              {summaries.length} Classes Registered
            </Badge>
          </div>

          {summaryLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="h-7 w-7 animate-spin mx-auto text-primary-600 mb-2" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aggregating Institutional Records...</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {summaries.map((sum) => {
                const isReadyToCompile = sum.completionPercentage >= 100 && !sum.isFullyCompiled;

                return (
                  <Card key={sum.className} className="border border-border bg-card text-card-foreground rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base font-black font-outfit uppercase text-foreground">{sum.className}</CardTitle>
                          <CardDescription className="text-[11px] font-semibold text-muted-foreground mt-0.5">
                            {sum.totalStudents} Enrolled • {sum.totalSubjects} Subjects
                          </CardDescription>
                        </div>
                        {sum.isFullyCompiled ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-black uppercase">
                            Compiled
                          </Badge>
                        ) : isReadyToCompile ? (
                          <Badge className="bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[9px] font-black uppercase">
                            Ready
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-black uppercase">
                            Incomplete
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 space-y-3">
                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-black">
                          <span className="text-muted-foreground uppercase">Marks Progress</span>
                          <span className="text-foreground">{sum.completionPercentage}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-500",
                              sum.completionPercentage >= 100 ? "bg-emerald-500" : "bg-primary-600"
                            )}
                            style={{ width: `${sum.completionPercentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-semibold text-muted-foreground">
                          <span>{sum.marksCount} of {sum.expectedMarksCount} marks recorded</span>
                          <span>{sum.resultsCount} snapshots ready</span>
                        </div>
                      </div>

                      {/* Subject chips */}
                      <div className="flex flex-wrap gap-1 max-h-12 overflow-hidden">
                        {sum.subjectNames.slice(0, 5).map(s => (
                          <span key={s} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                            {s}
                          </span>
                        ))}
                        {sum.subjectNames.length > 5 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                            +{sum.subjectNames.length - 5} more
                          </span>
                        )}
                      </div>

                      {/* Card Action Buttons (Compact) */}
                      <div className="pt-2 border-t border-border grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenInGazette(sum.className)}
                          className="rounded-xl font-bold text-xs h-8 border-border hover:bg-muted"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" /> Open Gazette
                        </Button>
                        <Button 
                          size="sm"
                          disabled={computing}
                          onClick={() => handleComputeResults(sum.className)}
                          className={cn(
                            "rounded-xl font-bold text-xs h-8 text-white",
                            sum.isFullyCompiled 
                              ? "bg-muted text-muted-foreground hover:bg-muted/80" 
                              : "bg-emerald-600 hover:bg-emerald-700"
                          )}
                        >
                          <Calculator className="w-3 h-3 mr-1" /> 
                          {sum.isFullyCompiled ? 'Re-Compile' : 'Compile Class'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ==================================================================== */}
        {/* TAB 2: CLASS GAZETTE (formerly Result Terminal)                      */}
        {/* ==================================================================== */}
        <TabsContent value="gazette" className="mt-5 space-y-5">
          {/* Integrated Selector Card */}
          <Card className="border border-border shadow-sm rounded-2xl bg-card text-card-foreground">
            <CardContent className="p-4 md:p-5 flex flex-col sm:flex-row items-center gap-3">
              {/* Class Selector */}
              <div className="flex-1 w-full space-y-1">
                <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">
                  Grade Level / Class
                </label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="h-10 rounded-xl bg-muted/40 border border-border font-bold text-xs text-foreground shadow-inner">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-popover text-popover-foreground border-border">
                    {settings?.classes?.map(c => <SelectItem key={c} value={c} className="font-bold text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Section Selector */}
              <div className="flex-1 w-full space-y-1">
                <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">
                  Class Section
                </label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="h-10 rounded-xl bg-muted/40 border border-border font-bold text-xs text-foreground shadow-inner">
                    <SelectValue placeholder="All Sections" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-popover text-popover-foreground border-border">
                    <SelectItem value="ALL" className="font-bold text-xs">All Sections</SelectItem>
                    {availableSections.map(s => (
                      <SelectItem key={s} value={s} className="font-bold text-xs">
                        Section {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Multi-Term Format Toggle (if multiple exams exist) */}
              {secondaryExam && (
                <div className="w-full sm:w-auto space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">
                    Print Card Format
                  </label>
                  <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border h-10">
                    <button
                      type="button"
                      onClick={() => setPrintFormat('single')}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all",
                        printFormat === 'single' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Single Term
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintFormat('combined')}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1",
                        printFormat === 'combined' ? "bg-primary-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Layers className="w-3 h-3" /> Combined
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {!selectedExam || !selectedClass ? (
            <div className="py-20 text-center space-y-3 border-2 border-dashed border-border rounded-2xl bg-card/40">
              <div className="h-14 w-14 bg-muted rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Trophy className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="font-black uppercase text-[10px] tracking-[0.25em] text-muted-foreground">
                Select Class to manage, compile, and print results
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">Candidates</p>
                  <p className="text-xl font-black font-outfit text-foreground">{classStats.total}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
                  <p className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Passed
                  </p>
                  <p className="text-xl font-black font-outfit text-emerald-600 dark:text-emerald-400">{classStats.passed}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
                  <p className="text-[9px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Failed
                  </p>
                  <p className="text-xl font-black font-outfit text-rose-600 dark:text-rose-400">{classStats.failed}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
                  <p className="text-[9px] font-black uppercase text-primary-600 dark:text-primary-400 tracking-wider">Class Average</p>
                  <p className="text-xl font-black font-outfit text-primary-600 dark:text-primary-400">{classStats.avgPct}%</p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border shadow-sm">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search candidate or roll..." 
                    className="h-10 pl-9 bg-muted/40 text-foreground border-border rounded-xl text-xs font-medium" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button 
                    onClick={() => handleComputeResults(selectedClass)} 
                    disabled={computing || dataLoading} 
                    className="h-10 px-4 bg-navy-900 hover:bg-navy-800 dark:bg-primary-600 dark:hover:bg-primary-700 text-white rounded-xl font-bold text-xs gap-1.5 shadow-sm"
                  >
                    {computing ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Calculator className="h-3.5 w-3.5" />} 
                    Compile Results
                  </Button>

                  <PrintButton 
                    type="result"
                    data={{
                      examId: selectedExam,
                      studentIds: selectedStudentIds.size > 0 
                        ? Array.from(selectedStudentIds) 
                        : filteredStudents.filter(s => results.some(r => r.studentId === s.id)).map(s => s.id),
                      isCombined: printFormat === 'combined',
                      secondaryExamId: secondaryExam?.id
                    }}
                    label={selectedStudentIds.size > 0 ? `Print Selected (${selectedStudentIds.size})` : `Print Class (${studentsWithResults.length})`}
                    className="h-10 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                    disabled={studentsWithResults.length === 0}
                    icon={<Printer className="h-3.5 w-3.5" />}
                  />
                </div>
              </div>

              {/* Student Table */}
              <Card className="border border-border shadow-sm overflow-hidden bg-card text-card-foreground rounded-2xl">
                <CardHeader className="bg-muted/40 border-b border-border p-3.5 px-5">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Checkbox 
                           id="select-all" 
                           checked={selectedStudentIds.size === studentsWithResults.length && studentsWithResults.length > 0}
                           onCheckedChange={toggleSelectAll}
                           className="h-4 w-4 rounded border-border"
                         />
                         <label htmlFor="select-all" className="font-black uppercase text-[10px] tracking-wider text-muted-foreground cursor-pointer">
                           Select All ({filteredStudents.length} Students)
                         </label>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase">
                        {studentsWithResults.length} Ready for Print
                      </Badge>
                   </div>
                </CardHeader>

                <div className="divide-y divide-border">
                  {dataLoading && (
                    <div className="py-16 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary-600 mb-2" />
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Loading Class Records...</p>
                    </div>
                  )}

                  {!dataLoading && filteredStudents.map((student) => {
                    const result = results.find(r => r.studentId === student.id);
                    const isSelected = selectedStudentIds.has(student.id);
                    
                    return (
                      <div 
                        key={student.id} 
                        className={cn(
                          "p-3.5 px-5 flex items-center justify-between transition-all group",
                          isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <Checkbox 
                            checked={isSelected}
                            disabled={!result}
                            onCheckedChange={() => toggleStudentSelection(student.id)}
                            className="h-4 w-4 rounded border-border"
                          />
                          <div className="h-8 w-11 bg-muted rounded-lg flex items-center justify-center font-black text-xs text-primary-600 dark:text-primary-400 shadow-sm border border-border shrink-0">
                            {student.rollNumber}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-foreground text-sm leading-tight font-outfit truncate uppercase">
                                {student.name}
                              </p>
                              <Badge variant="outline" className="text-[8px] font-bold uppercase py-0 px-1.5 h-4 text-muted-foreground border-border">
                                {student.section}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-semibold uppercase mt-0.5">
                              S/O {student.fatherName || '—'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {result ? (
                            <>
                              <div className="text-right hidden sm:block">
                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">Score</p>
                                <p className="text-xs font-black text-foreground font-outfit">{result.totalObtained} / {result.totalMax}</p>
                              </div>

                              <div className="text-right hidden sm:block">
                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">Percent</p>
                                <p className="text-sm font-black text-primary-600 dark:text-primary-400 tabular-nums font-outfit">{result.percentage}%</p>
                              </div>

                              <Badge className={cn(
                                "border-none text-[8px] font-black uppercase h-5 px-2",
                                result.status === 'Pass' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                              )}>
                                {result.status}
                              </Badge>

                              <span className="w-7 h-7 rounded-lg bg-muted text-foreground border border-border text-center leading-7 font-black text-xs shrink-0">
                                {result.grade}
                              </span>

                              <div className="flex items-center gap-1">
                                <Button asChild variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border hover:bg-primary-600 hover:text-white transition-all shadow-sm">
                                  <Link href={`/admin/print/result/${selectedExam}/${student.id}`} title="Print Result Card">
                                     <Printer className="h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                                <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-muted/60 text-primary-600 dark:text-primary-400 hover:bg-navy-900 hover:text-white transition-all">
                                  <Link href={`/admin/results/${selectedExam}/${student.id}`} title="View Details">
                                     <ChevronRight className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </div>
                            </>
                          ) : (
                            <Badge variant="outline" className="text-[9px] font-bold text-muted-foreground/70 uppercase border-dashed">
                              Computation Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {filteredStudents.length === 0 && !dataLoading && (
                    <div className="py-16 text-center text-muted-foreground font-black uppercase text-[10px] tracking-[0.4em] opacity-40">
                      No Matching Student Records
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ==================================================================== */}
        {/* TAB 3: SEQUENCE PROTOCOL                                             */}
        {/* ==================================================================== */}
        <TabsContent value="sequence" className="mt-5 space-y-5">
          <Card className="border border-border bg-card text-card-foreground rounded-2xl shadow-sm">
            <CardHeader className="p-5 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-black font-outfit uppercase">
                    Subject Sequence Protocol
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Order of subjects appearing on the printed Result Cards.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={sequenceClass} onValueChange={setSequenceClass}>
                    <SelectTrigger className="h-9 w-40 rounded-xl bg-muted/50 border-border font-bold text-xs">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border">
                      {settings?.classes?.map(c => <SelectItem key={c} value={c} className="font-bold text-xs">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Button 
                    onClick={handleSaveSequence} 
                    disabled={savingSequence || orderedSubjects.length === 0}
                    className="h-9 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                  >
                    {savingSequence ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Sequence
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 grid gap-6 lg:grid-cols-2">
              {/* Left Column: Reordering List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Subject Order ({orderedSubjects.length} Subjects)
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground">Use arrows to rearrange</span>
                </div>

                {orderedSubjects.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-border rounded-xl text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    No subjects configured for {sequenceClass}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {orderedSubjects.map((sub, idx) => (
                      <div 
                        key={sub.id} 
                        className="p-2.5 px-3 bg-muted/40 hover:bg-muted/70 rounded-xl border border-border flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-primary-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-black text-xs uppercase text-foreground">{sub.name}</p>
                            <p className="text-[9px] text-muted-foreground font-semibold">Max: {sub.maxMarks}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={idx === 0}
                            onClick={() => moveSubject(idx, 'up')}
                            className="h-7 w-7 rounded-lg hover:bg-muted"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={idx === orderedSubjects.length - 1}
                            onClick={() => moveSubject(idx, 'down')}
                            className="h-7 w-7 rounded-lg hover:bg-muted"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Live Table Preview */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-primary-600" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Live Result Card Table Preview
                  </span>
                </div>

                <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                  <div className="bg-[#1a3a6b] text-white p-2 text-center text-[11px] font-black uppercase tracking-wider font-outfit">
                    DETAIL OF MARKS OBTAINED
                  </div>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/80 text-foreground border-b border-border text-[9px] font-black uppercase">
                        <th className="py-2 px-2 text-center w-10">Sr. #</th>
                        <th className="py-2 px-2 text-left">Subjects</th>
                        <th className="py-2 px-2 text-center w-20">Total Marks</th>
                        <th className="py-2 px-2 text-center w-24">Marks Obtained</th>
                        <th className="py-2 px-2 text-center w-14">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-bold">
                      {orderedSubjects.map((sub, idx) => (
                        <tr key={sub.id} className="hover:bg-muted/30">
                          <td className="py-1.5 px-2 text-center text-muted-foreground font-black text-[11px]">{idx + 1}</td>
                          <td className="py-1.5 px-2 uppercase text-foreground text-[11px]">{sub.name}</td>
                          <td className="py-1.5 px-2 text-center text-muted-foreground text-[11px]">{sub.maxMarks}</td>
                          <td className="py-1.5 px-2 text-center text-primary-600 text-[11px]">—</td>
                          <td className="py-1.5 px-2 text-center text-muted-foreground text-[11px]">—</td>
                        </tr>
                      ))}
                      {orderedSubjects.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-muted-foreground text-xs">Select a class with configured subjects</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
