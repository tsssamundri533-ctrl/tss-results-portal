'use client';

import { use, useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Printer, 
  Loader2, 
  AlertTriangle, 
  MapPin, 
  Users, 
  Award, 
  School, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSchoolStore } from '@/store/use-school-store';
import { SeatingPlan } from '@/types';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getSeatingPlanById } from '@/lib/supabase-service';

export default function SeatingPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { settings } = useSchoolStore();
  const [plan, setPlan] = useState<SeatingPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlan() {
      try {
        setLoading(true);
        const data = await getSeatingPlanById(id);
        setPlan(data);
      } catch (err) {
        console.error('Failed to load seating plan:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPlan();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        <p className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Accessing Hall Matrix...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="py-24 text-center space-y-6">
        <AlertTriangle className="h-16 w-16 text-slate-200 dark:text-slate-800 mx-auto" />
        <div className="space-y-2">
           <h2 className="text-2xl font-bold font-outfit text-navy-900 dark:text-white">Plan Archive Not Found</h2>
           <p className="text-slate-400 dark:text-slate-500 max-w-xs mx-auto">This arrangement may have been restructured or archived.</p>
        </div>
        <Button asChild className="rounded-full px-8" variant="outline">
          <Link href="/admin/seating">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const totalOccupancy = plan.columns.reduce((acc, col) => acc + col.students.length, 0);

  return (
    <div className="space-y-8 max-w-[1700px] mx-auto pb-32 px-4 sm:px-6">
      {/* Dynamic Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full h-11 w-11 hover:bg-white dark:hover:bg-card">
            <Link href="/admin/seating">
              <ChevronLeft className="h-6 w-6 text-slate-600 dark:text-slate-300" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-navy-900 dark:text-white">
                {plan.roomName}
              </h1>
              <Badge variant="secondary" className="rounded-lg bg-primary-600/10 text-primary-600 font-bold px-3">
                {plan.corridor || 'Corridor A'}
              </Badge>
            </div>
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-2">
              <span className="font-semibold text-navy-900 dark:text-slate-300">{plan.examTitle}</span>
              <span>•</span>
              <span>Capacity: {plan.totalCapacity} Desks</span>
              <span>•</span>
              <span className="text-primary-600 font-bold">{totalOccupancy} Candidates Active</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" asChild className="rounded-xl border-slate-200 dark:border-white/10 dark:text-white font-bold h-11 px-5">
            <Link href={`/admin/seating/${id}/edit`}>
              Edit Arrangement
            </Link>
          </Button>

          <Button className="rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold h-11 px-6 gap-2 shadow-lg shadow-primary-600/20" asChild>
            <Link href={`/admin/print/seating/${id}`} target="_blank">
              <Printer className="h-4 w-4" />
              Print Chart
            </Link>
          </Button>
        </div>
      </header>

      {/* Grid Floor Plan Visualization */}
      <div className="bg-slate-50/50 dark:bg-card/40 border border-slate-200/60 dark:border-white/5 rounded-3xl p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
           <div>
              <h3 className="font-extrabold text-lg font-outfit text-navy-900 dark:text-white">Physical Floor Layout</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Left-to-right student seat indexing.</p>
           </div>
           <div className="flex gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2">
                 <div className="h-3 w-3 rounded-full bg-primary-600" />
                 <span className="text-slate-600 dark:text-slate-300">Allotted Desk</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="h-3 w-3 rounded-full bg-slate-200 dark:bg-white/10" />
                 <span className="text-slate-400">Empty Buffer</span>
              </div>
           </div>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-6 pt-2">
           {plan.columns.map((col, cIdx) => (
              <div key={cIdx} className="flex-1 min-w-[240px] max-w-[280px] bg-white dark:bg-card rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col">
                 <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
                    <div>
                       <span className="text-[10px] font-black uppercase text-primary-600 tracking-wider">Column {col.colIndex + 1}</span>
                       <h4 className="font-bold text-sm text-navy-900 dark:text-white mt-0.5">{col.className}</h4>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold border-slate-200 dark:border-white/10">
                       {col.students.length} Allocated
                    </Badge>
                 </div>

                 <div className="p-3 space-y-2.5 flex-1">
                    {col.students.map((student, sIdx) => (
                       <div key={sIdx} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100/80 dark:border-white/5 flex items-center justify-between group hover:border-primary-600/30 transition-all">
                          <div className="flex items-center gap-3 truncate">
                             <div className="h-8 w-8 rounded-lg bg-primary-600/10 text-primary-600 font-bold flex items-center justify-center text-xs">
                                {student.seatNumber}
                             </div>
                             <div className="truncate">
                                <p className="font-bold text-xs text-navy-900 dark:text-white truncate">{student.name}</p>
                                <p className="text-[10px] font-semibold text-slate-400">{student.className}</p>
                             </div>
                          </div>
                          <Badge variant="secondary" className="font-mono text-[10px] font-bold bg-white dark:bg-card shadow-sm border border-slate-100 dark:border-white/5">
                             {student.rollNumber}
                          </Badge>
                       </div>
                    ))}
                 </div>
              </div>
           ))}
        </div>
      </div>
    </div>
  );
}
