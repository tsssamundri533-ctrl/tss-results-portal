'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { Student, DateSheet } from '@/types';
import { useSchoolStore } from '@/store/use-school-store';
import { useSchoolSettings } from '@/hooks/use-school-settings';
import { QRCodeSVG } from 'qrcode.react';
import { format, parseISO } from 'date-fns';
import { Loader2, User, MapPin, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getStudents, getDateSheets } from '@/lib/supabase-service';

/**
 * Premium A4 Admit Cards Print Layout (Restored & Perfected).
 * Designed for The Spirit School Samundri.
 */
function SlipsPrintContent() {
  const searchParams = useSearchParams();
  const classId = searchParams.get('class');
  const sectionId = searchParams.get('section');
  const idsString = searchParams.get('ids');
  const targetIds = useMemo(() => idsString ? idsString.split(',') : [], [idsString]);

  useSchoolSettings();
  const settings = useSchoolStore(state => state.settings);

  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [dateSheet, setDateSheet] = useState<DateSheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!classId || !sectionId) return;
      try {
        setIsLoading(true);
        const [studentsData, sheets] = await Promise.all([
          getStudents(classId, sectionId),
          getDateSheets()
        ]);
        setAllStudents(studentsData.filter(s => s.status === 'active'));

        const targetId = `${classId}_${sectionId}`.replace(/\s+/g, '_');
        const match = sheets.find(s => s.id === targetId || s.className === classId) || null;
        setDateSheet(match);
      } catch (err) {
        console.error('Failed to load slips print data from Supabase:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [classId, sectionId]);

  const studentsToPrint = useMemo(() => {
    if (!allStudents.length) return [];
    if (targetIds.length === 0) return allStudents;
    return allStudents
      .filter(s => targetIds.includes(s.id))
      .sort((a, b) => parseInt(a.rollNumber) - parseInt(b.rollNumber));
  }, [allStudents, targetIds]);

  if (isLoading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400">Rendering Official Admit Cards...</p>
      </div>
    );
  }

  if (studentsToPrint.length === 0) {
    return <div className="p-20 text-center font-black text-rose-600 uppercase">Error: No candidates found for printing.</div>;
  }

  return (
    <div className="bg-white min-h-screen p-0 m-0 font-inter">
      {studentsToPrint.map((student, idx) => (
        <div key={student.id} className="w-full max-w-[210mm] mx-auto p-8 mb-8 border border-slate-200 rounded-3xl bg-white shadow-sm print:shadow-none print:border-none print:m-0 print:p-6 print:page-break-after-always">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
            <h1 className="text-2xl font-black uppercase text-slate-900 font-outfit">
              {settings.profile?.schoolName || 'The Spirit School Samundri'}
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mt-1">
              Roll Number Slip / Admit Card
            </p>
          </div>

          {/* Student Info and Photo */}
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold uppercase">Name:</span>
                <span className="text-base font-black text-slate-900">{student.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold uppercase">Father:</span>
                <span className="text-sm font-bold text-slate-800">{student.fatherName || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                <span>Class: <strong className="text-slate-900">{student.class} - {student.section}</strong></span>
                <span>Roll No: <strong className="text-slate-900 font-mono text-sm bg-slate-100 px-2 py-0.5 rounded">{student.rollNumber}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {student.photoURL ? (
                <img 
                  src={student.photoURL} 
                  alt={student.name} 
                  className="w-20 h-24 object-cover rounded-xl border-2 border-slate-900 shadow-sm"
                />
              ) : (
                <div className="w-20 h-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400 text-center p-1">
                  Affix Photo
                </div>
              )}
              <div className="p-1 bg-white border border-slate-200 rounded-lg">
                <QRCodeSVG value={`TSS_${student.rollNumber}_${student.id}`} size={70} />
              </div>
            </div>
          </div>

          {/* Exam Schedule */}
          {dateSheet && dateSheet.papers?.length > 0 ? (
            <div className="mb-6">
              <h3 className="text-xs font-black uppercase text-slate-900 mb-2 tracking-wider">Exam Schedule</h3>
              <table className="w-full text-xs text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="p-2 font-bold text-slate-800">Subject</th>
                    <th className="p-2 font-bold text-slate-800">Date</th>
                    <th className="p-2 font-bold text-slate-800">Reporting</th>
                    <th className="p-2 font-bold text-slate-800">Start Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dateSheet.papers.map((p, pIdx) => (
                    <tr key={pIdx}>
                      <td className="p-2 font-semibold text-slate-900">{p.subjectName || p.subjectId}</td>
                      <td className="p-2 text-slate-700">{p.date || 'TBA'}</td>
                      <td className="p-2 text-slate-700">{p.reportingTime || '08:30 AM'}</td>
                      <td className="p-2 text-slate-700">{p.startTime || '09:00 AM'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {/* Instructions */}
          <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Exam Instructions:</p>
            <p>1. Students must bring this slip to every examination session.</p>
            <p>2. Electronic gadgets, smart watches, and unauthorized material are strictly prohibited.</p>
            <p>3. Reporting time is 15 minutes before the start of each examination paper.</p>
          </div>

          {/* Signatures */}
          <div className="mt-8 pt-4 border-t-2 border-slate-900 flex justify-between items-center text-xs font-bold text-slate-800">
            <div>Principal Signature</div>
            <div>Controller of Examinations</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SlipsPrintPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-bold">Loading...</div>}>
      <SlipsPrintContent />
    </Suspense>
  );
}
