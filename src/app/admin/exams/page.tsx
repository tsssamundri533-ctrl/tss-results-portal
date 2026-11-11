'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  Lock, 
  Unlock, 
  ChevronRight, 
  MoreVertical, 
  Loader2, 
  Trash2, 
  Settings2,
  FileSpreadsheet,
  CheckCircle2,
  Layers,
  Star,
  Copy,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from '@/store/use-auth-store';
import { useToast } from '@/hooks/use-toast';
import { Exam } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { getExams, toggleExamLock, deleteExam } from '@/lib/supabase-service';
import { useExamStore } from '@/store/use-exam-store';
import { cn } from '@/lib/utils';

export default function ExamsPage() {
  const { toast } = useToast();
  const { schoolId } = useAuthStore();
  const { activeExamId, setActiveExamId, setExams: setStoreExams } = useExamStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExamsList = async () => {
    setLoading(true);
    try {
      const data = await getExams();
      setExams(data);
      setStoreExams(data);
    } catch (err) {
      console.error('Error fetching exams from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamsList();
  }, []);

  const filteredExams = exams.filter(e => 
    (e.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleLock = async (exam: Exam) => {
    const newStatus = !exam.isLocked;
    
    // 1. Supabase update
    const ok = await toggleExamLock(exam.id, newStatus);
    if (ok) {
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, isLocked: newStatus } : e));
      toast({
        title: newStatus ? "Exam Locked" : "Exam Unlocked",
        description: newStatus 
          ? "Marks entry for this exam cycle is now restricted." 
          : "Staff can now resume marks entry.",
      });
    } else {
      toast({ title: "Failed to update lock status", variant: "destructive" });
    }
  };

  const handleDelete = async (exam: Exam) => {
    try {
      const ok = await deleteExam(exam.id);
      if (ok) {
        setExams(prev => prev.filter(e => e.id !== exam.id));
        toast({
          title: "Examination Cycle Deleted",
          description: `${exam.title} has been permanently removed.`,
        });
      } else {
        throw new Error("Supabase delete failed");
      }
    } catch (e) {
      toast({
        title: "Delete Failed",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-24 px-4 sm:px-0 font-inter">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-foreground font-outfit uppercase">
            Examinations & Assessments
          </h1>
          <p className="text-xs text-muted-foreground font-semibold">
            Manage institutional terms, schedule papers, and lock or publish grading cycles.
          </p>
        </div>
        <Button 
          className="rounded-xl shadow-sm h-10 px-5 gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs" 
          asChild
        >
          <Link href="/admin/exams/new">
            <Plus className="h-4 w-4" />
            New Examination
          </Link>
        </Button>
      </header>

      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search exam title..." 
            className="w-full pl-9 h-10 bg-muted/40 text-foreground border-border rounded-xl text-xs font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Badge className="bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 px-2.5 py-1 text-[10px] font-bold shrink-0">
          {exams.length} Cycles Registered
        </Badge>
      </div>

      {/* Exam Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border border-border rounded-2xl h-44 animate-pulse bg-card" />
          ))
        ) : filteredExams.length === 0 ? (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-2xl bg-card">
            <div className="h-14 w-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-foreground font-bold text-base font-outfit">No examinations found</p>
            <p className="text-muted-foreground text-xs mt-1">Create an examination cycle to configure classes and record marks.</p>
            <Button className="mt-4 rounded-xl h-9 px-4 text-xs font-bold bg-primary-600 text-white" asChild>
              <Link href="/admin/exams/new">Create Final Term</Link>
            </Button>
          </div>
        ) : (
          filteredExams.map((exam) => {
            const classCount = (exam.classes || []).length;
            const categoryLabel = exam.examTypeId === 'final-term' ? 'Final Term'
              : exam.examTypeId === 'second-term' ? 'Second Term'
              : exam.examTypeId === 'first-term' ? 'First Term'
              : exam.examTypeId === 'mid-term' ? 'Mid-Term'
              : exam.examTypeId === 'annual' ? 'Annual'
              : 'Assessment';

            return (
              <Card 
                key={exam.id} 
                className="border border-border shadow-sm rounded-2xl overflow-hidden hover:border-primary-500/50 transition-all bg-card text-card-foreground flex flex-col justify-between"
              >
                <CardContent className="p-4 md:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Top Row: Icon + Badge + Actions */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center border transition-colors shrink-0",
                          exam.isLocked 
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" 
                            : "bg-primary-500/10 border-primary-500/20 text-primary-600 dark:text-primary-400"
                        )}>
                          {exam.isLocked ? <Lock className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        </div>
                        <div>
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider py-0 px-2 rounded-md border-border">
                            {categoryLabel}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground font-bold mt-0.5">Year: {exam.year || 2026}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {exam.id === activeExamId && (
                          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold text-[9px] uppercase px-2 py-0.5 rounded-md gap-1">
                            <Sparkles className="h-2.5 w-2.5" /> Active
                          </Badge>
                        )}

                        <Badge className={cn(
                          "border-none font-bold text-[9px] uppercase px-2 py-0.5 rounded-md",
                          exam.isLocked 
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" 
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        )}>
                          {exam.isLocked ? 'Locked' : 'Open'}
                        </Badge>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border border-border shadow-lg w-52 bg-popover text-popover-foreground">
                            {exam.id !== activeExamId && (
                              <DropdownMenuItem 
                                onSelect={() => {
                                  setActiveExamId(exam.id);
                                  toast({
                                    title: "Active Term Set",
                                    description: `${exam.title} is now set as the active term across the portal.`,
                                  });
                                }}
                                className="cursor-pointer font-bold text-xs gap-2 text-primary-600 focus:text-primary-600 focus:bg-primary-500/10"
                              >
                                <Star className="h-3.5 w-3.5" /> Set as Active Term
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild className="cursor-pointer font-bold text-xs gap-2">
                              <Link href={`/admin/exams/new?cloneFrom=${exam.id}`}>
                                <Copy className="h-3.5 w-3.5 text-blue-600" /> Clone to New Term
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer font-bold text-xs gap-2">
                              <Link href={`/admin/exams/${exam.id}`}>
                                <Settings2 className="h-3.5 w-3.5 text-primary-600" /> Configure Classes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer font-bold text-xs gap-2">
                              <Link href={`/admin/marks/${exam.id}`}>
                                <FileText className="h-3.5 w-3.5 text-emerald-600" /> Marks Entry
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer font-bold text-xs gap-2">
                              <Link href={`/admin/results`}>
                                <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-600" /> View Gazette
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onSelect={() => handleToggleLock(exam)}
                              className="cursor-pointer font-bold text-xs gap-2"
                            >
                              {exam.isLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                              {exam.isLocked ? "Unlock for Marks" : "Lock Cycle"}
                            </DropdownMenuItem>
                            <div className="h-px bg-border my-1" />
                            <DropdownMenuItem 
                              onSelect={() => setDeleteTarget(exam)}
                              className="cursor-pointer font-bold text-xs gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete Exam
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="mt-3">
                      <h3 className="font-black text-base text-foreground font-outfit uppercase truncate">
                        {exam.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-medium">
                        <Calendar className="h-3 w-3 text-muted-foreground/70" />
                        <span>
                          {exam.startDate ? format(new Date(exam.startDate), 'MMM d') : 'Active Session'}
                          {exam.endDate ? ` - ${format(new Date(exam.endDate), 'MMM d, yyyy')}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Stats & Quick Actions */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                      <Layers className="h-3.5 w-3.5 text-primary-600" />
                      <span>{classCount} {classCount === 1 ? 'Class' : 'Classes'} Registered</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button 
                        asChild 
                        variant="outline" 
                        size="sm" 
                        className="h-8 rounded-lg px-2.5 text-[11px] font-bold border-border hover:bg-muted"
                      >
                        <Link href={`/admin/exams/${exam.id}`}>
                          Configure
                        </Link>
                      </Button>
                      <Button 
                        asChild 
                        size="sm" 
                        className="h-8 rounded-lg px-2.5 text-[11px] font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                      >
                        <Link href={`/admin/marks/${exam.id}`}>
                          Marks
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl border border-border shadow-xl bg-card text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black font-outfit uppercase text-foreground">
              Delete Examination Cycle
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete <strong>{deleteTarget?.title}</strong>? All configurations and result snapshots will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-border text-xs font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              onClick={() => {
                if (deleteTarget) handleDelete(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
