'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ChevronRight, PenLine, Loader2, ArrowLeft, Sparkles, Star, Lock } from 'lucide-react';
import Link from 'next/link';
import { Exam } from '@/types';
import { getExams } from '@/lib/supabase-service';
import { useSchoolStore } from '@/store/use-school-store';
import { useSchoolSettings } from '@/hooks/use-school-settings';
import { useExamStore } from '@/store/use-exam-store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminMarksOverview() {
  useSchoolSettings();
  const { settings } = useSchoolStore();
  const { activeExamId, setActiveExamId } = useExamStore();
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getExams();
        setExams(data);
      } catch (err) {
        console.error('Failed to load exams:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const sortedExams = useMemo(() => {
    return [...exams].sort((a, b) => {
      if (a.id === activeExamId) return -1;
      if (b.id === activeExamId) return 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [exams, activeExamId]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 font-inter px-4 sm:px-0">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/dashboard" className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground font-outfit uppercase">
            Marks Management
          </h1>
          <p className="text-muted-foreground font-medium text-sm">
            Select an academic term below to record or update student evaluation scores.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((_, i) => (
            <div key={i} className="h-44 rounded-3xl bg-muted/50 animate-pulse border border-border" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent text-center p-12 rounded-3xl border-border">
          <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground">No active examinations</h3>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {sortedExams.map((exam) => {
            const isActive = exam.id === activeExamId;
            return (
              <Card 
                key={exam.id} 
                className={cn(
                  "border shadow-sm rounded-[2rem] bg-card text-card-foreground p-6 hover:shadow-md transition-all flex flex-col justify-between",
                  isActive ? "border-primary-500/40 ring-2 ring-primary-500/20" : "border-border"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isActive ? (
                        <Badge className="bg-emerald-600 font-bold px-3 py-1 text-white border-none gap-1.5 shadow-sm text-xs">
                          <Sparkles className="h-3.5 w-3.5" /> Active Term
                        </Badge>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setActiveExamId(exam.id);
                            toast({
                              title: "Active Term Switched",
                              description: `${exam.title} is now active across the portal.`,
                            });
                          }}
                          className="h-7 px-2.5 text-[10px] font-bold border-border hover:bg-muted text-muted-foreground"
                        >
                          <Star className="h-3 w-3 mr-1 text-amber-500" /> Set as Active
                        </Button>
                      )}

                      {exam.isLocked && (
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold text-[10px] gap-1">
                          <Lock className="h-2.5 w-2.5" /> Locked
                        </Badge>
                      )}
                    </div>

                    <span className="text-xs font-black uppercase text-muted-foreground">
                      Year {exam.year}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-foreground uppercase font-outfit mb-2">
                    {exam.title}
                  </h2>
                  <p className="text-xs font-semibold text-muted-foreground mb-6">
                    Configured Classes: {exam.classes?.join(', ') || 'All Classes'}
                  </p>
                </div>

                <Button asChild className="w-full rounded-2xl h-14 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-wider text-xs gap-2 shadow-md">
                  <Link href={`/admin/marks/${exam.id}`}>
                    <PenLine className="h-4 w-4" /> Open Marks Register <ChevronRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
