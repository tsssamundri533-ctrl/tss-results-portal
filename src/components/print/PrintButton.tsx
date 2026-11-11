'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSchoolStore } from '@/store/use-school-store';
import { supabase } from '@/lib/supabase';
import { getExamById, getExams, getDateSheets, getStudents, getSeatingPlanById } from '@/lib/supabase-service';
import { getAttendanceRecords } from '@/lib/attendance-service';
import { Result, Student } from '@/types';

// Import isolated print modules
import { generateSlipsHtml } from '@/lib/print/admit-cards';
import { generateResultsBatchHtml } from '@/lib/print/result-cards';
import { generateAttendanceReportHtml } from '@/lib/print/attendance-reports';
import { generateSeatingPlanHtml } from '@/lib/print/seating-plans';

interface PrintButtonProps {
  type: 'rollSlip' | 'result' | 'attendanceReport' | 'seatingPlan';
  data: {
    examId?: string;
    studentId?: string;
    classId?: string;
    sectionId?: string;
    date?: string;
    studentIds?: string[]; 
    planId?: string;
    isCombined?: boolean;
    secondaryExamId?: string;
  };
  label?: string;
  variant?: "default" | "outline" | "secondary";
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

async function fetchInBatches<T>(
  ids: string[],
  fetcher: (batch: string[]) => Promise<T[]>
): Promise<T[]> {
  const BATCH_SIZE = 80;
  const results: T[] = [];
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const chunk = ids.slice(i, i + BATCH_SIZE);
    const chunkData = await fetcher(chunk);
    results.push(...chunkData);
  }
  return results;
}

/**
 * Institutional Print Terminal.
 * Modular Injection Protocol: Opens an about:blank tab and injects high-fidelity HTML/CSS.
 */
export function PrintButton({ type, data, label, variant = "default", className, icon, disabled }: PrintButtonProps) {
  const [loading, setLoading] = useState(false);
  const settings = useSchoolStore(state => state.settings);

  const handlePrint = async () => {
    if (!settings) return;
    
    setLoading(true);
    try {
      let html = '';
      
      if (type === 'rollSlip') {
        const { examId, classId, sectionId, studentIds } = data;
        let dateSheet: any = null;

        // 1. Try to find dateSheet from Supabase
        const allDateSheets = await getDateSheets();
        if (allDateSheets && allDateSheets.length > 0) {
          dateSheet = allDateSheets.find(ds => 
            (ds.className === classId || !classId) && 
            (ds.sectionName === sectionId || !sectionId)
          );
        }

        // 2. Fallback to exam classConfigs if no dateSheet in database
        if (!dateSheet && examId) {
          const exam = await getExamById(examId);
          if (exam) {
            let classConfig = exam.classConfigs?.[classId || ''];
            let subsObj = classConfig?.subjects || {};
            
            // If this exam has empty subjects for this class, fallback to First Term / any other exam
            if (Object.keys(subsObj).length === 0) {
              const allExams = await getExams();
              const backupExam = allExams.find(e => Object.keys(e.classConfigs?.[classId || '']?.subjects || {}).length > 0);
              if (backupExam) {
                subsObj = backupExam.classConfigs?.[classId || '']?.subjects || {};
              }
            }

            const papers = Object.entries(subsObj)
              .sort(([, a]: any, [, b]: any) => (a.order || 99) - (b.order || 99))
              .map(([subId, sub]: any) => ({
                subjectId: subId,
                subjectName: sub.name || subId,
                date: sub.date || '',
                reportingTime: sub.reportingTime || '08:30 AM',
                startTime: sub.startTime || '09:00 AM'
              }));

            dateSheet = {
              examTitle: exam.title,
              className: classId,
              sectionName: sectionId,
              papers
            };
          }
        }

        const targetIds = studentIds || [];
        let students: any[] = [];
        if (targetIds.length > 0) {
          const rawStudents = await fetchInBatches(targetIds, async (chunk) => {
            const { data } = await supabase.from('students').select('*').in('id', chunk);
            return data || [];
          });
          
          students = rawStudents.map((s: any) => ({
            id: s.id,
            rollNumber: s.roll_number,
            name: s.name,
            fatherName: s.father_name,
            gender: s.gender,
            class: s.class_name,
            section: s.section_name,
            sessionId: s.session_id,
            photoURL: s.photo_url,
            status: s.status,
            schoolId: s.school_id,
            corridor: s.corridor || 'east',
            qrToken: s.qr_token || '',
            createdAt: s.created_at
          }));
        }

        html = await generateSlipsHtml(students, dateSheet as any, settings);
      } 
      else if (type === 'result') {
        const { examId, studentId, studentIds } = data;
        const targetIds = studentId ? [studentId] : (studentIds || []);
        if (targetIds.length === 0 || !examId) return;

        // Fetch from Supabase in batches (prevents any truncation)
        const resultsData = await fetchInBatches(targetIds, async (chunk) => {
          const { data } = await supabase.from('results').select('*').eq('exam_id', examId).in('student_id', chunk);
          return data || [];
        });

        const studentsData = await fetchInBatches(targetIds, async (chunk) => {
          const { data } = await supabase.from('students').select('*').in('id', chunk);
          return data || [];
        });

        const exam = await getExamById(examId);

        const mappedResults: Result[] = (resultsData || []).map((r: any) => ({
          id: r.id,
          studentId: r.student_id,
          examId: r.exam_id,
          schoolId: r.school_id,
          studentName: r.student_name,
          rollNumber: r.roll_number,
          className: r.class_name,
          sectionName: r.section_name,
          gender: r.gender,
          photoURL: r.photo_url,
          subjects: r.subjects || {},
          totalObtained: Number(r.total_obtained),
          totalMax: Number(r.total_max),
          percentage: Number(r.percentage),
          grade: r.grade,
          status: r.status,
          remarks: r.remarks,
          computedAt: r.computed_at
        }));

        const mappedStudents: Student[] = (studentsData || []).map((s: any) => ({
          id: s.id,
          rollNumber: s.roll_number,
          name: s.name,
          fatherName: s.father_name,
          gender: s.gender,
          class: s.class_name,
          section: s.section_name,
          sessionId: s.session_id,
          photoURL: s.photo_url,
          status: s.status,
          schoolId: s.school_id,
          corridor: s.corridor || 'east',
          qrToken: s.qr_token || '',
          createdAt: s.created_at
        }));

        let secondaryExam = null;
        let secondaryResults: Result[] = [];
        if (data.isCombined && data.secondaryExamId) {
          secondaryExam = await getExamById(data.secondaryExamId);
          const secResData = await fetchInBatches(targetIds, async (chunk) => {
            const { data: resData } = await supabase
              .from('results')
              .select('*')
              .eq('exam_id', data.secondaryExamId)
              .in('student_id', chunk);
            return resData || [];
          });

          secondaryResults = (secResData || []).map((r: any) => ({
            id: r.id,
            studentId: r.student_id,
            examId: r.exam_id,
            schoolId: r.school_id,
            studentName: r.student_name,
            rollNumber: r.roll_number,
            className: r.class_name,
            sectionName: r.section_name,
            gender: r.gender,
            photoURL: r.photo_url,
            subjects: r.subjects || {},
            totalObtained: Number(r.total_obtained),
            totalMax: Number(r.total_max),
            percentage: Number(r.percentage),
            grade: r.grade,
            status: r.status,
            remarks: r.remarks,
            computedAt: r.computed_at
          }));
        }

        // Fetch all results for the entire class(es) to compute 100% accurate dynamic class positions
        const classNames = Array.from(new Set(mappedResults.map(r => r.className).filter(Boolean)));
        let allClassResults: Result[] = [];
        let allSecondaryClassResults: Result[] = [];

        if (classNames.length > 0) {
          const { data: fullClassData } = await supabase
            .from('results')
            .select('*')
            .eq('exam_id', examId)
            .in('class_name', classNames);

          if (fullClassData) {
            allClassResults = fullClassData.map((r: any) => ({
              id: r.id,
              studentId: r.student_id,
              examId: r.exam_id,
              schoolId: r.school_id,
              studentName: r.student_name,
              rollNumber: r.roll_number,
              className: r.class_name,
              sectionName: r.section_name,
              gender: r.gender,
              photoURL: r.photo_url,
              subjects: r.subjects || {},
              totalObtained: Number(r.total_obtained),
              totalMax: Number(r.total_max),
              percentage: Number(r.percentage),
              grade: r.grade,
              status: r.status,
              remarks: r.remarks,
              computedAt: r.computed_at
            }));
          }

          if (data.isCombined && data.secondaryExamId) {
            const { data: secFullClassData } = await supabase
              .from('results')
              .select('*')
              .eq('exam_id', data.secondaryExamId)
              .in('class_name', classNames);

            if (secFullClassData) {
              allSecondaryClassResults = secFullClassData.map((r: any) => ({
                id: r.id,
                studentId: r.student_id,
                examId: r.exam_id,
                schoolId: r.school_id,
                studentName: r.student_name,
                rollNumber: r.roll_number,
                className: r.class_name,
                sectionName: r.section_name,
                gender: r.gender,
                photoURL: r.photo_url,
                subjects: r.subjects || {},
                totalObtained: Number(r.total_obtained),
                totalMax: Number(r.total_max),
                percentage: Number(r.percentage),
                grade: r.grade,
                status: r.status,
                remarks: r.remarks,
                computedAt: r.computed_at
              }));
            }
          }
        }

        html = await generateResultsBatchHtml(
          mappedResults, 
          mappedStudents, 
          exam || ({} as any), 
          settings,
          {
            isCombined: data.isCombined,
            secondaryExam,
            secondaryResults,
            allClassResults,
            allSecondaryClassResults
          }
        );
      }
      else if (type === 'attendanceReport') {
        const { examId, classId, date } = data;
        if (!examId || !classId || !date) return;

        const records = await getAttendanceRecords(examId, date);
        const allStudents = await getStudents(classId);
        const activeStudents = allStudents.filter(s => s.status === 'active').sort((a,b) => parseInt(a.rollNumber) - parseInt(b.rollNumber));
        const exam = await getExamById(examId);
        html = await generateAttendanceReportHtml(records, activeStudents, exam as any, settings, date, classId, 'Authorized Proctor');
      }
      else if (type === 'seatingPlan') {
        const { planId } = data;
        if (!planId) return;
        const plan = await getSeatingPlanById(planId);
        if (plan) {
          html = await generateSeatingPlanHtml(plan as any, settings);
        }
      }

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Print Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      onClick={handlePrint}
      disabled={loading || disabled}
      className={cn("gap-2 shadow-lg transition-all active:scale-95 font-black uppercase text-[10px] tracking-widest", className)}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (icon || <Printer className="h-4 w-4" />)}
      {label || "Print"}
    </Button>
  );
}
