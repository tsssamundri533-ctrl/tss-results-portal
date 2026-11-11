'use client';

import { use, useState, useEffect } from 'react';
import { SeatingPlan } from '@/types';
import { useSchoolStore } from '@/store/use-school-store';
import { useSchoolSettings } from '@/hooks/use-school-settings';
import { getSeatingPlanById } from '@/lib/supabase-service';
import { format } from 'date-fns';
import { Loader2, Award, ShieldCheck, MapPin, Users, School } from 'lucide-react';

/**
 * Premium Landscape A4 Hall Seating Layout (Dedicated Print Terminal).
 * Completely optimized for physical mono-printing at The Spirit School Samundri.
 */
export default function SeatingPlanPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  useSchoolSettings();
  const settings = useSchoolStore(state => state.settings);
  const [plan, setPlan] = useState<SeatingPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  useEffect(() => {
    async function loadPlan() {
      try {
        setPlanLoading(true);
        const data = await getSeatingPlanById(id);
        setPlan(data);
      } catch (err) {
        console.error('Failed to load plan for print:', err);
      } finally {
        setPlanLoading(false);
      }
    }
    loadPlan();
  }, [id]);

  useEffect(() => {
    if (!planLoading && plan) {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [planLoading, plan]);

  if (planLoading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600 mb-4" />
        <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400">Restoring Hall Matrix Registry...</p>
      </div>
    );
  }

  if (!plan) return <div className="p-20 text-center font-black text-rose-600 uppercase">Error: Seating arrangement missing in registry.</div>;

  const totalStudents = plan.columns.reduce((acc, col) => acc + col.students.length, 0);

  return (
    <div className="bg-white min-h-screen p-0 m-0 font-inter">
      {/* LANDSCAPE A4 WRAPPER */}
      <div className="w-[297mm] min-h-[210mm] bg-white p-10 flex flex-col relative border-none">
        
        {/* Institutional Print Header */}
        <div className="text-center border-b-4 border-double border-black pb-6 mb-8">
           <h1 className="text-4xl font-black uppercase font-outfit text-black tracking-tight">
             {settings.profile?.schoolName || 'The Spirit School Samundri'}
           </h1>
           <p className="text-lg font-bold uppercase tracking-[0.4em] mt-1.5 text-black">
             EXAMINATION HALL SEATING ARRANGEMENT
           </p>
           
           <div className="flex items-center justify-between mt-6 px-4 text-xs font-black uppercase text-black">
             <div className="flex items-center gap-2">
               <span>ROOM / VENUE:</span>
               <span className="text-sm underline font-black">{plan.roomName}</span>
             </div>
             <div className="flex items-center gap-2">
               <span>SESSION / EXAM:</span>
               <span className="text-sm underline font-black">{plan.examTitle}</span>
             </div>
             <div className="flex items-center gap-2">
               <span>DATE:</span>
               <span className="text-sm underline font-black">{format(new Date(), 'dd-MM-yyyy')}</span>
             </div>
           </div>
        </div>

        {/* Matrix Grid Columns */}
        <div className="flex-1 flex gap-4 w-full">
          {plan.columns.map((col, idx) => (
             <div key={idx} className="flex-1 border-2 border-black flex flex-col h-full bg-white">
                
                {/* Column Banner */}
                <div className="border-b-2 border-black p-2 bg-slate-100 text-center text-black">
                   <p className="text-xs font-black uppercase">ROW / COL {col.colIndex + 1}</p>
                   <p className="text-xs font-bold uppercase tracking-wider">{col.className}</p>
                   {col.sectionName && <p className="text-[10px] font-bold text-black uppercase">Sec: {col.sectionName}</p>}
                </div>

                {/* Candidate Rows */}
                <div className="flex-1 flex flex-col divide-y-2 divide-black">
                   {col.students.map((student, sIdx) => (
                      <div key={sIdx} className="p-2 flex items-center justify-between text-xs text-black">
                         <div className="flex items-center gap-2 truncate">
                            <span className="font-mono font-black border border-black px-1.5 py-0.5 rounded text-[10px]">
                              {String(student.seatNumber).padStart(2, '0')}
                            </span>
                            <div className="truncate">
                               <p className="font-black uppercase truncate text-[11px] leading-tight">{student.name}</p>
                               <p className="text-[9px] font-bold text-black">{student.className}</p>
                            </div>
                         </div>
                         <span className="font-mono font-black text-xs bg-slate-100 px-1 border border-black">
                            {student.rollNumber}
                         </span>
                      </div>
                   ))}

                   {/* Blank/Ghost Rows to maintain physical consistency */}
                   {Array.from({ length: Math.max(0, 10 - col.students.length) }).map((_, bIdx) => (
                      <div key={`blank-${bIdx}`} className="p-2 flex items-center justify-between text-xs text-black opacity-30">
                         <span className="font-mono text-[10px]">--</span>
                         <span className="text-[10px] font-bold tracking-widest">VACANT</span>
                         <span className="font-mono text-[10px]">--</span>
                      </div>
                   ))}
                </div>

                <div className="p-1.5 border-t-2 border-black bg-slate-50 text-[10px] font-black text-center text-black">
                   {col.students.length} CANDIDATES
                </div>
             </div>
          ))}
        </div>

        {/* Footer Authority Signatures */}
        <div className="mt-10 border-t-2 border-black pt-8 flex items-center justify-between text-xs font-black uppercase text-black">
           <div>
              <p>Total Candidates Allotted: <span className="underline font-mono">{totalStudents}</span> / {plan.totalCapacity}</p>
              <p className="text-[10px] text-black mt-1">Generated: {format(new Date(), 'PPpp')}</p>
           </div>
           
           <div className="flex gap-16 text-center">
              <div>
                 <div className="w-48 border-b-2 border-black pb-1 mb-1 font-mono">&nbsp;</div>
                 <p className="text-[10px]">HALL SUPERINTENDENT</p>
              </div>
              <div>
                 <div className="w-48 border-b-2 border-black pb-1 mb-1 font-mono">&nbsp;</div>
                 <p className="text-[10px]">CONTROLLER OF EXAMINATIONS</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
