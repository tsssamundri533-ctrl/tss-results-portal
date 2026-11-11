'use client';

import React, { useEffect, useState } from 'react';
import { 
  GraduationCap, 
  ChevronDown, 
  Check, 
  Lock, 
  Unlock, 
  Plus, 
  Settings2,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useExamStore } from '@/store/use-exam-store';
import { getExams } from '@/lib/supabase-service';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function TermSwitcher() {
  const { activeExamId, exams, setActiveExamId, setExams } = useExamStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function fetchLatestExams() {
      try {
        setLoading(true);
        const data = await getExams();
        setExams(data);
      } catch (err) {
        console.error('Failed to load exams in TermSwitcher:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLatestExams();
  }, [setExams]);

  if (!mounted || exams.length === 0) return null;

  const currentExam = exams.find(e => e.id === activeExamId) || exams[0];

  const handleSelect = (examId: string) => {
    const selected = exams.find(e => e.id === examId);
    if (!selected) return;
    setActiveExamId(examId);
    toast({
      title: "Active Term Switched",
      description: `Current workspace context is now set to ${selected.title}.`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 px-3 gap-2 rounded-xl bg-surface-50 dark:bg-navy-950/80 border-surface-200 dark:border-white/10 hover:border-primary-500/40 text-foreground font-semibold text-xs shadow-sm transition-all"
        >
          <div className="h-6 w-6 rounded-lg bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
            <GraduationCap className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col items-start text-left leading-tight">
            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Term</span>
            <span className="font-bold text-xs truncate max-w-[130px] sm:max-w-[170px] text-navy-900 dark:text-white">
              {currentExam?.title || 'Select Term'}
            </span>
          </div>
          {currentExam?.isLocked ? (
            <Lock className="h-3 w-3 text-amber-500 shrink-0" />
          ) : (
            <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-60 ml-0.5 shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64 p-1.5 rounded-2xl border border-border shadow-xl bg-card text-card-foreground">
        <DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>Examination Terms</span>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border font-bold">
            {exams.length} Cycles
          </Badge>
        </DropdownMenuLabel>
        
        <div className="space-y-0.5 my-1 max-h-60 overflow-y-auto">
          {exams.map((exam) => {
            const isActive = exam.id === currentExam?.id;
            return (
              <DropdownMenuItem
                key={exam.id}
                onClick={() => handleSelect(exam.id)}
                className={cn(
                  "px-2.5 py-2 rounded-xl cursor-pointer font-medium text-xs flex items-center justify-between transition-colors",
                  isActive 
                    ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold" 
                    : "hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    exam.isLocked ? "bg-amber-500" : "bg-emerald-500"
                  )} />
                  <div className="flex flex-col truncate">
                    <span className="truncate">{exam.title}</span>
                    <span className="text-[9px] text-muted-foreground font-normal">
                      {exam.year || 2026} • {exam.isLocked ? 'Locked' : 'Active'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {exam.isLocked && <Lock className="h-3 w-3 text-amber-500" />}
                  {isActive && <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator className="my-1 bg-border" />

        <DropdownMenuItem asChild className="px-2.5 py-2 rounded-xl cursor-pointer text-xs font-bold text-primary-600 hover:text-primary-700 hover:bg-primary-500/10 gap-2">
          <Link href="/admin/exams/new">
            <Plus className="h-3.5 w-3.5" />
            Create New Term
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="px-2.5 py-2 rounded-xl cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted gap-2">
          <Link href="/admin/exams">
            <Settings2 className="h-3.5 w-3.5" />
            Manage All Examinations
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
