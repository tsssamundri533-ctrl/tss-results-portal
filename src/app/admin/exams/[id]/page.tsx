'use client';

import { use, useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Calendar, 
  Lock, 
  Unlock, 
  BookOpen, 
  School,
  Loader2,
  Trash2,
  AlertTriangle,
  Plus,
  CheckCircle2,
  X,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useAuthStore } from '@/store/use-auth-store';
import { useSchoolStore } from '@/store/use-school-store';
import { useSchoolSettings } from '@/hooks/use-school-settings';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Exam } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { getExamById, updateExam, deleteExam, toggleExamLock } from '@/lib/supabase-service';
import { cn } from '@/lib/utils';

export default function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  useSchoolSettings();
  const { toast } = useToast();
  const router = useRouter();
  const { schoolId } = useAuthStore();
  const { settings } = useSchoolStore();
  
  const [mounted, setMounted] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [addingClass, setAddingClass] = useState(false);

  const [selectedClass, setSelectedClass] = useState("");
  const [subjectWeights, setSubjectWeights] = useState<Record<string, { maxMarks: number, date: string, startTime: string, reportingTime: string }>>({});

  const loadExam = async () => {
    setLoading(true);
    try {
      const data = await getExamById(id);
      setExam(data);
    } catch (err) {
      console.error('Error loading exam:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadExam();
  }, [id]);

  useEffect(() => {
    if (selectedClass && settings?.subjects) {
      const relevant = settings.subjects.filter(s => s.appliesTo?.includes(selectedClass));
      const weights: any = {};
      relevant.forEach((s, idx) => {
        weights[s.id] = { maxMarks: 50, date: '', startTime: '09:00 AM', reportingTime: '08:30 AM', order: idx + 1 };
      });
      setSubjectWeights(weights);
    }
  }, [selectedClass, settings?.subjects]);

  const handleAddClassConfig = async () => {
    if (!exam || !selectedClass) return;
    setAddingClass(true);
    try {
      const relevantSubjects = settings?.subjects?.filter(s => s.appliesTo?.includes(selectedClass)) || [];
      const config: any = { subjects: {} };
      
      relevantSubjects.forEach((s, idx) => {
        config.subjects[s.id] = {
          name: s.name,
          order: idx + 1,
          ...subjectWeights[s.id]
        };
      });

      const updatedConfigs = { ...(exam.classConfigs || {}), [selectedClass]: config };
      const updatedClasses = Array.from(new Set([...(exam.classes || []), selectedClass]));

      // 1. Save to Supabase
      const ok = await updateExam(id, {
        classConfigs: updatedConfigs,
        classes: updatedClasses
      });

      if (ok) {
        setExam(prev => prev ? { ...prev, classConfigs: updatedConfigs, classes: updatedClasses } : null);
        toast({ title: "Class Configuration Added", description: `Subject weights set for ${selectedClass}.` });
        setIsAddClassOpen(false);
        setSelectedClass("");
      } else {
        throw new Error("Supabase update failed");
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to add class", variant: "destructive" });
    } finally {
      setAddingClass(false);
    }
  };

  const removeClass = async (cls: string) => {
    if (!exam || !window.confirm(`Remove all configurations for ${cls}?`)) return;
    const configs = { ...exam.classConfigs };
    delete configs[cls];
    const classes = (exam.classes || []).filter(c => c !== cls);

    const ok = await updateExam(id, {
      classConfigs: configs,
      classes: classes
    });

    if (ok) {
      setExam(prev => prev ? { ...prev, classConfigs: configs, classes } : null);
      toast({ title: "Class Removed", description: `Removed configuration for ${cls}.` });
    }
  };

  const handleToggleLock = async () => {
    if (!exam) return;
    const newStatus = !exam.isLocked;
    const ok = await toggleExamLock(id, newStatus);
    if (ok) {
      setExam(prev => prev ? { ...prev, isLocked: newStatus } : null);
      toast({ title: newStatus ? "Exam Locked" : "Exam Unlocked" });
    }
  };

  const handleDeleteExam = async () => {
    if (!exam || !window.confirm("Archive this examination cycle permanently?")) return;
    const ok = await deleteExam(id);
    if (ok) {
      toast({ title: "Exam Archived", variant: "destructive" });
      router.push('/admin/exams');
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-10 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Record Not Found</h2>
        <Button variant="outline" asChild className="rounded-xl h-9 text-xs">
          <Link href="/admin/exams">Back to Exams</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-24 px-4 sm:px-0 mt-4 font-inter">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-xl h-9 w-9 bg-card border-border shadow-sm" 
            asChild
          >
            <Link href="/admin/exams">
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground font-outfit uppercase">
              {exam.title}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider py-0 px-2 rounded-md border-border">
                {exam.examTypeId} Cycle
              </Badge>
              <Badge className={cn(
                "border-none text-[9px] font-bold uppercase px-2 py-0.5 rounded-md",
                exam.isLocked ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              )}>
                {exam.isLocked ? 'Locked' : 'Active'}
              </Badge>
              <span className="text-[10px] text-muted-foreground font-semibold">
                Pass Threshold: {exam.passPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2">
          <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-9 px-4 gap-1.5 bg-primary-600 hover:bg-primary-700 font-bold text-xs text-white shadow-sm">
                <Plus className="h-3.5 w-3.5" />
                Add Class Setup
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-xl rounded-2xl border border-border shadow-xl bg-card text-card-foreground">
              <DialogHeader className="p-4 pb-0">
                <DialogTitle className="text-base font-black font-outfit uppercase text-foreground">
                  Configure Grade Setup
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Set subject marks and schedule for this grade level.
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 pt-2 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Target Grade</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="h-10 bg-muted/40 border border-border rounded-xl font-bold text-xs text-foreground">
                      <SelectValue placeholder="Choose grade level..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-popover text-popover-foreground border-border">
                      {settings?.classes?.filter(c => !(exam.classes || []).includes(c)).map(c => (
                        <SelectItem key={c} value={c} className="font-bold text-xs">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedClass && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-primary-600 dark:text-primary-400 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" /> Subject Weights for {selectedClass}
                    </h3>
                    <div className="space-y-2">
                      {(settings?.subjects || []).filter(s => s.appliesTo?.includes(selectedClass)).map(sub => (
                        <div key={sub.id} className="p-3 bg-muted/40 rounded-xl border border-border flex items-center justify-between gap-3">
                          <p className="font-bold text-xs text-foreground uppercase">{sub.name}</p>
                          <div className="flex items-center gap-2">
                            <div className="w-24">
                              <Input 
                                type="number"
                                placeholder="Marks"
                                value={subjectWeights[sub.id]?.maxMarks || 50}
                                onChange={e => setSubjectWeights({ 
                                  ...subjectWeights, 
                                  [sub.id]: { ...subjectWeights[sub.id], maxMarks: parseInt(e.target.value) || 0 }
                                })}
                                className="h-8 bg-card border-border rounded-lg font-bold text-center text-xs text-foreground"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="p-4 border-t border-border">
                <Button 
                  onClick={handleAddClassConfig} 
                  disabled={addingClass || !selectedClass}
                  className="w-full h-9 rounded-xl bg-primary-600 hover:bg-primary-700 font-bold text-xs text-white shadow-sm"
                >
                  {addingClass ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                  Confirm Setup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button 
            asChild
            variant="outline" 
            className="rounded-xl h-9 px-3.5 text-xs font-bold border-border bg-card hover:bg-muted"
          >
            <Link href={`/admin/marks/${exam.id}`}>
              <FileText className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Marks Entry
            </Link>
          </Button>

          <Button 
            asChild
            variant="outline" 
            className="rounded-xl h-9 px-3.5 text-xs font-bold border-border bg-card hover:bg-muted"
          >
            <Link href="/admin/results">
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-indigo-600" /> Gazette
            </Link>
          </Button>

          <Button 
            variant="outline" 
            className="rounded-xl h-9 px-3 text-xs font-bold border-border bg-card hover:bg-muted" 
            onClick={handleToggleLock}
          >
            {exam.isLocked ? <Unlock className="h-3.5 w-3.5 mr-1" /> : <Lock className="h-3.5 w-3.5 mr-1" />}
            {exam.isLocked ? 'Unlock' : 'Lock'}
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl h-9 w-9 text-rose-600 hover:bg-rose-500/10" 
            onClick={handleDeleteExam}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Class List */}
      {(!exam.classes || exam.classes.length === 0) ? (
        <Card className="border-2 border-dashed border-border py-16 text-center rounded-2xl bg-card">
          <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
            <School className="h-6 w-6 text-muted-foreground/60" />
          </div>
          <h3 className="text-base font-bold text-foreground">No classes configured</h3>
          <p className="text-xs text-muted-foreground mt-1">Start by adding a grade level to define its subject criteria.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {exam.classes.map((cls) => {
            const config = exam.classConfigs?.[cls];
            const subjectsList = Object.entries(config?.subjects || {}).sort((a: any, b: any) => (a[1].order || 99) - (b[1].order || 99));

            return (
              <Card key={cls} className="border border-border shadow-sm rounded-2xl overflow-hidden bg-card text-card-foreground">
                <CardHeader className="bg-muted/30 border-b border-border p-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-card shadow-sm flex items-center justify-center text-primary-600 border border-border shrink-0">
                      <School className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-black uppercase text-foreground font-outfit">{cls}</CardTitle>
                      <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {subjectsList.length} Subjects Configured
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-rose-600 rounded-lg" 
                    onClick={() => removeClass(cls)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-muted/10 border-b border-border text-[9px] font-black uppercase text-muted-foreground">
                          <th className="py-2.5 px-4 w-12 text-center">Sr. #</th>
                          <th className="py-2.5 px-4">Subject Component</th>
                          <th className="py-2.5 px-4 text-center w-28">Max Marks</th>
                          <th className="py-2.5 px-4 text-center w-36">Paper Date</th>
                          <th className="py-2.5 px-4 text-right w-36">Timing</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {subjectsList.map(([subId, sub]: any, idx) => (
                          <tr key={subId} className="hover:bg-muted/20 transition-colors">
                            <td className="py-2.5 px-4 text-center text-muted-foreground font-bold">{idx + 1}</td>
                            <td className="py-2.5 px-4 font-bold uppercase text-foreground">{sub.name}</td>
                            <td className="py-2.5 px-4 text-center">
                              <Badge variant="outline" className="font-black text-xs px-2.5 py-0.5 rounded-md border-border bg-card">
                                {sub.maxMarks}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {sub.date ? format(new Date(sub.date), 'MMM dd') : '—'}
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-right text-[11px] font-medium text-muted-foreground">
                              {sub.startTime || '09:00 AM'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
