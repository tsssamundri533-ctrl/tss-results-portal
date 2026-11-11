
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, 
  Plus, 
  CheckCircle2, 
  Loader2,
  Grid3X3,
  MapPin,
  Minus,
  Eye,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/store/use-auth-store';
import { useSchoolStore } from '@/store/use-school-store';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Exam, Student } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { getExams, getStudents, upsertSeatingPlan } from '@/lib/supabase-service';

const CORRIDORS = ["Corridor A", "Corridor B", "Corridor C"];

interface ColumnConfig {
  capacity: number;
  classId: string;
}

export default function NewSeatingPlanPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const schoolId = useAuthStore(state => state.schoolId);
  const user = useAuthStore(state => state.user);
  const settings = useSchoolStore(state => state.settings);
  const settingsLoading = useSchoolStore(state => state.isLoading);
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  const [roomName, setRoomName] = useState('Main Exam Hall');
  const [examId, setExamId] = useState('');
  const [selectedCorridor, setSelectedCorridor] = useState('all');
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([
    { capacity: 10, classId: '' },
    { capacity: 10, classId: '' },
    { capacity: 10, classId: '' },
    { capacity: 10, classId: '' },
    { capacity: 10, classId: '' },
  ]);

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      try {
        setDataLoading(true);
        const [examsData, studentsData] = await Promise.all([
          getExams(),
          getStudents()
        ]);
        setAvailableExams(examsData);
        setAllStudents(studentsData);
        if (examsData.length > 0) {
          setExamId(examsData[0].id);
        }
      } catch (err) {
        console.error('Failed to load exams or students for seating plan:', err);
      } finally {
        setDataLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!allStudents) return [];
    if (selectedCorridor === 'all') return allStudents.filter(s => s.status === 'active');
    return allStudents.filter(s => s.status === 'active' && s.corridor === selectedCorridor);
  }, [allStudents, selectedCorridor]);

  const availableClasses = useMemo(() => settings?.classes || [], [settings?.classes]);

  const currentPlan = useMemo(() => {
    if (!filteredStudents) return [];
    
    const studentPool: Record<string, Student[]> = {};
    filteredStudents.forEach(s => {
      if (!studentPool[s.class]) studentPool[s.class] = [];
      studentPool[s.class].push(s);
    });

    Object.keys(studentPool).forEach(cls => {
      studentPool[cls].sort((a, b) => {
        const rollA = parseInt(a.rollNumber) || 0;
        const rollB = parseInt(b.rollNumber) || 0;
        return rollA - rollB;
      });
    });

    const studentCounters: Record<string, number> = {};
    let globalSeatCounter = 1;

    return columnConfigs.map((config, cIdx) => {
      const colStudents: any[] = [];
      const targetCls = config.classId;

      if (targetCls && studentPool[targetCls]) {
        const startIndex = studentCounters[targetCls] || 0;
        const slice = studentPool[targetCls].slice(startIndex, startIndex + config.capacity);
        
        slice.forEach((s, sIdx) => {
          colStudents.push({
            studentId: s.id,
            rollNumber: s.rollNumber,
            name: s.name,
            className: s.class,
            seatNumber: globalSeatCounter + sIdx
          });
        });
        
        studentCounters[targetCls] = startIndex + slice.length;
      }
      
      const colResult = {
        colIndex: cIdx,
        className: targetCls || 'Vacant',
        students: colStudents,
        capacity: config.capacity
      };

      globalSeatCounter += config.capacity;
      return colResult;
    });
  }, [filteredStudents, columnConfigs]);

  const totalRoomCapacity = useMemo(() => 
    columnConfigs.reduce((acc, c) => acc + c.capacity, 0)
  , [columnConfigs]);

  const totalStudentsAllocated = useMemo(() => 
    currentPlan.reduce((acc, col) => acc + col.students.length, 0)
  , [currentPlan]);

  const handleAddColumn = () => {
    if (columnConfigs.length >= 12) return;
    setColumnConfigs(prev => [...prev, { capacity: 10, classId: '' }]);
  };

  const handleRemoveColumn = () => {
    if (columnConfigs.length <= 1) return;
    setColumnConfigs(prev => prev.slice(0, -1));
  };

  const updateCol = useCallback((idx: number, field: keyof ColumnConfig, val: any) => {
    setColumnConfigs(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  }, []);

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examId) {
      toast({ variant: "destructive", title: "Missing Information", description: "Select an exam cycle to proceed." });
      return;
    }

    setLoading(true);
    try {
      const exam = availableExams.find(e => e.id === examId);
      const planId = `plan_${Date.now()}`;
      
      const planData = {
        id: planId,
        examId,
        examTitle: exam?.title || 'Examination',
        roomName,
        corridor: selectedCorridor,
        columns: currentPlan,
        totalCapacity: totalRoomCapacity,
        schoolId: schoolId || 'tss-main-school',
        createdAt: new Date().toISOString(),
        createdBy: user?.uid || 'Admin'
      };

      const ok = await upsertSeatingPlan(planData);
      if (!ok) throw new Error("Upsert failed");

      toast({ 
        title: "Seating Plan Committed", 
        description: `${roomName} arrangement saved to registry.` 
      });
      router.push('/admin/seating');
    } catch (e) {
      toast({ variant: "destructive", title: "Allocation Failed" });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || settingsLoading || dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Accessing Registry...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto pb-24 px-4 sm:px-6">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 mt-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full bg-white dark:bg-card shadow-sm border dark:border-white/5" asChild>
            <Link href="/admin/seating"><ChevronLeft className="h-5 w-5 dark:text-white" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit">Seating Matrix Generator</h1>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Multi-Grade Hall Protocol</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Hall Load</p>
              <p className="text-xl font-black font-outfit text-primary-600 dark:text-primary-400">{totalStudentsAllocated} / {totalRoomCapacity} Seats</p>
           </div>
           <Button 
             onClick={handleCommit}
             disabled={loading || totalStudentsAllocated === 0}
             className="rounded-2xl h-12 px-10 bg-navy-900 hover:bg-navy-800 dark:bg-primary-600 font-bold shadow-xl gap-2 text-white"
           >
             {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
             Finalize Hall Plan
           </Button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: Configuration Panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-card rounded-[2.5rem] overflow-hidden bg-white dark:bg-card border dark:border-white/5">
            <CardHeader className="bg-primary-600 p-6 text-white">
              <CardTitle className="text-xl font-outfit flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" /> Hall Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1">Hall Designation</Label>
                  <Input 
                    value={roomName}
                    onChange={e => setRoomName(e.target.value)}
                    placeholder="e.g. Room 01, Main Hall"
                    className="h-12 rounded-xl bg-slate-50 dark:bg-navy-950 border-none font-bold text-lg dark:text-white"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1">Assessment Cycle</Label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 custom-scrollbar">
                    {availableExams.map(e => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setExamId(e.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2",
                          examId === e.id 
                            ? "bg-primary-600 border-primary-600 text-white shadow-lg" 
                            : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-primary-200"
                        )}
                      >
                        {e.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1">Target Zone</Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCorridor('all')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2",
                        selectedCorridor === 'all' 
                          ? "bg-navy-900 dark:bg-primary-600 border-navy-900 dark:border-primary-600 text-white shadow-lg" 
                          : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-primary-200"
                      )}
                    >
                      Global
                    </button>
                    {CORRIDORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedCorridor(c)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2",
                          selectedCorridor === c 
                            ? "bg-navy-900 dark:bg-primary-600 border-navy-900 dark:border-primary-600 text-white shadow-lg" 
                            : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-primary-200"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1">Column Geometry</Label>
                  <div className="flex items-center gap-2">
                     <Button size="icon" variant="outline" className="h-7 w-7 rounded-full dark:border-white/10 dark:text-white" onClick={handleRemoveColumn}><Minus className="h-3 w-3" /></Button>
                     <span className="font-black w-6 text-center text-sm dark:text-white">{columnConfigs.length}</span>
                     <Button size="icon" variant="outline" className="h-7 w-7 rounded-full dark:border-white/10 dark:text-white" onClick={handleAddColumn}><Plus className="h-3 w-3" /></Button>
                  </div>
                </div>

                <ScrollArea className="h-[450px] pr-4">
                  <div className="space-y-3">
                    {columnConfigs.map((config, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 dark:bg-navy-950/50 rounded-2xl border border-slate-100 dark:border-white/5 group transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-md">
                        <div className="flex items-center justify-between mb-3">
                          <Badge className="bg-navy-900 dark:bg-primary-700 text-white border-none font-black text-[9px] uppercase px-3 h-5">Column {idx + 1}</Badge>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">Seats</span>
                             <Input 
                               type="number"
                               value={config.capacity}
                               onChange={e => updateCol(idx, 'capacity', parseInt(e.target.value) || 0)}
                               className="w-16 h-8 text-center bg-white dark:bg-navy-900 border-slate-200 dark:border-white/10 rounded-lg font-bold text-xs dark:text-white"
                             />
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5">
                           {availableClasses.map(c => {
                             const isSelected = config.classId === c;
                             return (
                               <button
                                 key={c}
                                 type="button"
                                 onClick={() => updateCol(idx, 'classId', isSelected ? '' : c)}
                                 className={cn(
                                   "px-2 py-1 rounded-md text-[10px] font-black uppercase transition-all border",
                                   isSelected 
                                     ? "bg-primary-600 border-primary-600 text-white shadow-sm" 
                                     : "bg-white dark:bg-navy-900 border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500 hover:border-primary-200"
                                 )}
                               >
                                 {c}
                               </button>
                             );
                           })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Hall Preview */}
        <div className="lg:col-span-8">
          <Card className="border-none shadow-card rounded-[2.5rem] bg-white dark:bg-card overflow-hidden h-full min-h-[750px] flex flex-col border dark:border-white/5">
            <CardHeader className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl dark:text-white">Hall Matrix Preview</CardTitle>
                <CardDescription className="dark:text-slate-400">Live floor plan of physical seat assignments.</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                    <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Dynamic Layout</span>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 flex-1 overflow-x-auto custom-scrollbar">
              {totalStudentsAllocated === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4">
                   <Eye className="h-16 w-16 text-slate-400 dark:text-slate-600" />
                   <div className="space-y-1">
                      <p className="font-bold text-xl dark:text-white">Hall Is Vacant</p>
                      <p className="text-sm max-w-xs dark:text-slate-400">Assign grades to columns on the left to visualize the seating matrix.</p>
                   </div>
                </div>
              ) : (
                <div className="flex gap-6 min-w-max justify-center pb-8">
                  {currentPlan.map((column, cIdx) => (
                    <div key={cIdx} className="w-56 space-y-4">
                      <div className="bg-navy-900 dark:bg-primary-600 text-white p-3 rounded-xl text-center shadow-lg border border-navy-800 dark:border-primary-500">
                        <p className="text-sm font-black truncate leading-none mb-1 uppercase">{column.className}</p>
                        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/40">Aisle {cIdx + 1}</p>
                      </div>
                      
                      <div className="space-y-3">
                        {Array.from({ length: column.capacity }).map((_, sIdx) => {
                          const seat = column.students[sIdx];
                          const seatNo = (currentPlan.slice(0, cIdx).reduce((a,c)=>a+c.capacity, 0)) + sIdx + 1;
                          return (
                            <div 
                              key={`${cIdx}-${sIdx}`}
                              className={cn(
                                "h-36 rounded-2xl border-2 p-5 transition-all flex flex-col justify-between relative shadow-sm",
                                seat 
                                  ? "bg-white dark:bg-white/5 border-primary-100 dark:border-white/10" 
                                  : "bg-slate-50 dark:bg-white/5 border-dashed border-slate-200 dark:border-white/5 opacity-40"
                              )}
                            >
                               <div className="flex justify-between items-start">
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-tighter",
                                    seat ? "text-primary-600 dark:text-primary-400" : "text-slate-300 dark:text-slate-700"
                                  )}>
                                    {seat ? `ROLL: ${seat.rollNumber}` : "VACANT"}
                                  </span>
                                  <span className="text-[9px] font-black text-slate-200 dark:text-white/10">#{seatNo}</span>
                               </div>
                               {seat ? (
                                 <>
                                   <p className="text-lg font-bold text-navy-900 dark:text-white line-clamp-2 leading-snug py-1 font-outfit">
                                     {seat.name}
                                   </p>
                                   <div>
                                      <Badge className="bg-slate-100 dark:bg-navy-950 text-slate-500 dark:text-slate-400 border-none font-black text-[7px] uppercase h-3.5 px-1.5">{seat.className}</Badge>
                                   </div>
                                 </>
                               ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 p-6 flex justify-center">
               <div className="flex items-center gap-8 flex-wrap justify-center">
                  <div className="flex items-center gap-2">
                     <div className="h-3 w-3 rounded-full bg-primary-600" />
                     <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Allocated Seat</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="h-3 w-3 rounded-full border-2 border-dashed border-slate-300 dark:border-white/10" />
                     <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Empty Capacity</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="h-3 w-3 rounded-full bg-navy-900 dark:bg-primary-600" />
                     <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Column Marker</span>
                  </div>
               </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
