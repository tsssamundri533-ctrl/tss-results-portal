'use client';

import React, { use, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, BookOpen, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Exam, Student } from '@/types';
import { getExamById, getStudents } from '@/lib/supabase-service';
import { useSchoolStore } from '@/store/use-school-store';
import { useSchoolSettings } from '@/hooks/use-school-settings';

export default function ExamMarksSelector({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  useSchoolSettings();
  const { settings } = useSchoolStore();

  const [exam, setExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [exData, stData] = await Promise.all([
          getExamById(examId),
          getStudents()
        ]);
        setExam(exData);
        setStudents(stData);
      } catch (err) {
        console.error('Error loading exam marks selector:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [examId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Loading Evaluation Registers...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-24 text-muted-foreground font-bold uppercase text-xs">
        Exam record not found.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-32 font-inter px-4 sm:px-0">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-card border border-border shadow-sm text-foreground" asChild>
            <Link href="/admin/marks"><ChevronLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <Badge className="bg-primary-600 font-black text-[9px] uppercase px-2 text-white border-none">Evaluation Center</Badge>
               <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                 {exam.title}
               </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground font-outfit uppercase">
              Select Class & Subject
            </h1>
          </div>
        </div>
      </header>

      <div className="grid gap-8">
        {Object.entries(exam.classConfigs || {}).map(([className, config]) => {
          const classStudents = students.filter(s => s.class === className);
          
          return (
            <Card key={className} className="border border-border shadow-sm rounded-[2.5rem] bg-card text-card-foreground overflow-hidden">
              <CardHeader className="bg-muted/40 border-b border-border p-6 md:p-8 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black font-outfit uppercase text-foreground">{className}</CardTitle>
                  <CardDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    {classStudents.length} Active Students Enrolled
                  </CardDescription>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-card border border-border flex items-center justify-center font-black text-primary-600 text-sm">
                  {Object.keys(config.subjects || {}).length}
                </div>
              </CardHeader>
              
              <CardContent className="p-6 md:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(config.subjects || {}).map(([subId, sub]) => (
                    <Link
                      key={subId}
                      href={`/admin/marks/${exam.id}/${subId}?class=${encodeURIComponent(className)}`}
                      className="p-5 rounded-2xl bg-muted/30 hover:bg-muted border border-border transition-all group flex flex-col justify-between h-36"
                    >
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground/80 block mb-1">
                          Max Marks: {sub.maxMarks}
                        </span>
                        <h4 className="text-lg font-black uppercase tracking-tight text-foreground leading-tight">
                          {sub.name}
                        </h4>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-[10px] font-bold text-primary-600 group-hover:text-primary-500 uppercase tracking-wider">
                          Enter Scores →
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
