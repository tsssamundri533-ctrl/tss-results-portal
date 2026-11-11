'use client';

import { use, useEffect, useState, useMemo } from 'react';
import { Result, Student, Exam } from '@/types';
import { useSchoolStore } from '@/store/use-school-store';
import { useSchoolSettings } from '@/hooks/use-school-settings';
import { format } from 'date-fns';
import { Loader2, ArrowLeft, Printer, Layers, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  getStudentById, 
  getExamById, 
  getResultByStudent,
  getResults,
  getExams
} from '@/lib/supabase-service';
import { getDynamicRemarks, getGradeRemark, getChronologicalWeight } from '@/lib/print/result-cards';

const MALE_AVATAR = "https://i.postimg.cc/x1BZ31bs/male.png";
const FEMALE_AVATAR = "https://i.postimg.cc/7hgPwR8W/1487318.png";

const NUM_TO_WORD: Record<string, string> = {
  '1': 'ONE', '2': 'TWO', '3': 'THREE', '4': 'FOUR', '5': 'FIVE',
  '6': 'SIX', '7': 'SEVEN', '8': 'EIGHT', '9': 'NINE', '10': 'TEN'
};

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function ResultPrintPage({ params }: { params: Promise<{ examId: string, studentId: string }> }) {
  const { examId, studentId } = use(params);
  useSchoolSettings();
  const settings = useSchoolStore(state => state.settings);

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<Result | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  
  // Entire class results for dynamic class position calculation
  const [classResults, setClassResults] = useState<Result[]>([]);
  const [secondaryClassResults, setSecondaryClassResults] = useState<Result[]>([]);

  // Multi-term support
  const [isCombined, setIsCombined] = useState(false);
  const [secondaryExam, setSecondaryExam] = useState<Exam | null>(null);
  const [secondaryResult, setSecondaryResult] = useState<Result | null>(null);
  const [loadingSecondary, setLoadingSecondary] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [res, stu, ex, examsList] = await Promise.all([
          getResultByStudent(examId, studentId),
          getStudentById(studentId),
          getExamById(examId),
          getExams()
        ]);
        setResult(res);
        setStudent(stu);
        setExam(ex);
        setAllExams(examsList);

        if (res?.className) {
          const cResults = await getResults(examId, res.className);
          setClassResults(cResults);
        }

        // Intelligently find opposite exam for combined comparison
        const otherExams = examsList.filter(e => e.id !== examId);
        if (otherExams.length > 0) {
          const isCurrentFinal = examId.toLowerCase().includes('final') || (ex?.title || '').toLowerCase().includes('final');
          const preferred = otherExams.find(e => 
            isCurrentFinal 
              ? e.title.toLowerCase().includes('first') || e.title.toLowerCase().includes('1st')
              : e.title.toLowerCase().includes('final') || e.title.toLowerCase().includes('second') || e.title.toLowerCase().includes('2nd')
          ) || otherExams[0];

          setSecondaryExam(preferred);
          const otherRes = await getResultByStudent(preferred.id, studentId);
          setSecondaryResult(otherRes);

          if (res?.className) {
            const secCResults = await getResults(preferred.id, res.className);
            setSecondaryClassResults(secCResults);
          }
        }
      } catch (err) {
        console.error('Error loading result print card:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [examId, studentId]);

  const handleSelectSecondaryExam = async (targetExamId: string) => {
    const chosen = allExams.find(e => e.id === targetExamId);
    if (!chosen) return;
    setSecondaryExam(chosen);
    setLoadingSecondary(true);
    try {
      const otherRes = await getResultByStudent(chosen.id, studentId);
      setSecondaryResult(otherRes);

      if (result?.className) {
        const secCResults = await getResults(chosen.id, result.className);
        setSecondaryClassResults(secCResults);
      }
    } catch (err) {
      console.error('Error loading secondary exam result:', err);
    } finally {
      setLoadingSecondary(false);
    }
  };

  const gender = result?.gender || student?.gender || 'male';
  const displayPhoto = result?.photoURL || student?.photoURL || (gender === 'female' ? FEMALE_AVATAR : MALE_AVATAR);
  
  const rawClass = (result?.className || '').replace(/Class\s*/i, '').trim();
  const displayClassName = NUM_TO_WORD[rawClass] || rawClass.toUpperCase() || 'THREE';

  // Combine calculations if in Combined Mode
  let combinedTotalObtained = result?.totalObtained || 0;
  let combinedTotalMax = result?.totalMax || 0;
  let combinedPercentage = result?.percentage || 0;
  let combinedGrade = result?.grade || 'A+';
  let combinedStatus = result?.status || 'Pass';

  if (isCombined && secondaryResult && result) {
    combinedTotalObtained = Number((result.totalObtained + secondaryResult.totalObtained).toFixed(1));
    combinedTotalMax = result.totalMax + secondaryResult.totalMax;
    combinedPercentage = combinedTotalMax > 0 
      ? Number(((combinedTotalObtained / combinedTotalMax) * 100).toFixed(1))
      : 0;

    const scale = settings?.gradingScale || [];
    const matchedGrade = scale.find(g => combinedPercentage >= g.min);
    combinedGrade = matchedGrade?.grade || (combinedPercentage >= 80 ? 'A+' : combinedPercentage >= 70 ? 'A' : combinedPercentage >= 60 ? 'B' : combinedPercentage >= 50 ? 'C' : 'F');
    combinedStatus = combinedPercentage >= (exam?.passPercentage || 33) ? 'Pass' : 'Fail';
  }

  // Calculate 100% Dynamic Position across entire class
  const dynamicPosition = useMemo(() => {
    if (!result || classResults.length === 0) return '—';

    if (isCombined && secondaryExam) {
      // Combined ranking: calculate aggregate score for all students in the class
      const scoredList = classResults.map(r1 => {
        const r2 = secondaryClassResults.find(r => r.studentId === r1.studentId);
        const t1Obt = Number(r1.totalObtained || 0);
        const t1Max = Number(r1.totalMax || 0);
        const t2Obt = Number(r2?.totalObtained || 0);
        const t2Max = Number(r2?.totalMax || 0);
        const totalObt = t1Obt + t2Obt;
        const totalMax = t1Max + t2Max;
        const pct = totalMax > 0 ? (totalObt / totalMax) * 100 : 0;
        return {
          studentId: r1.studentId,
          totalObt,
          pct
        };
      });

      scoredList.sort((a, b) => {
        if (Math.abs(b.pct - a.pct) > 0.0001) return b.pct - a.pct;
        return b.totalObt - a.totalObt;
      });

      let currentRank = 1;
      for (let i = 0; i < scoredList.length; i++) {
        if (i > 0) {
          const prev = scoredList[i - 1];
          const curr = scoredList[i];
          if (Math.abs(curr.pct - prev.pct) > 0.0001 || curr.totalObt !== prev.totalObt) {
            currentRank++;
          }
        }
        if (scoredList[i].studentId === studentId) {
          return `${getOrdinal(currentRank)} Position`;
        }
      }
    } else {
      // Single Term ranking across entire class
      const scoredList = classResults.map(r => {
        const obt = Number(r.totalObtained || 0);
        const max = Number(r.totalMax || 0);
        const pct = max > 0 ? (obt / max) * 100 : Number(r.percentage || 0);
        return {
          studentId: r.studentId,
          totalObtained: obt,
          percentage: pct
        };
      });

      scoredList.sort((a, b) => {
        if (Math.abs(b.percentage - a.percentage) > 0.0001) return b.percentage - a.percentage;
        return b.totalObtained - a.totalObtained;
      });

      let currentRank = 1;
      for (let i = 0; i < scoredList.length; i++) {
        if (i > 0) {
          const prev = scoredList[i - 1];
          const curr = scoredList[i];
          if (Math.abs(curr.percentage - prev.percentage) > 0.0001 || curr.totalObtained !== prev.totalObtained) {
            currentRank++;
          }
        }
        if (scoredList[i].studentId === studentId) {
          return `${getOrdinal(currentRank)} Position`;
        }
      }
    }

    return '—';
  }, [result, classResults, isCombined, secondaryExam, secondaryClassResults, studentId]);

  if (loading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600 mb-3" />
        <p className="font-bold uppercase tracking-[0.2em] text-[11px] text-muted-foreground">Preparing Official Performance Card...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-20 text-center font-bold text-rose-600 uppercase">
        Error: Result record missing in registry.
      </div>
    );
  }

  // 100% Dynamic, Individualized, Position-Aware Remarks based strictly on OVERALL result
  const autoRemark = getDynamicRemarks({
    manualRemarks: result.remarks,
    percentage: isCombined ? combinedPercentage : result.percentage,
    grade: isCombined ? combinedGrade : result.grade,
    positionStr: dynamicPosition,
    status: isCombined ? combinedStatus : result.status,
    isCombined,
    remarksConfig: settings?.remarksConfig
  });

  // Chronologically resolve which exam is Term 1 (earlier) and which is Term 2 (later)
  const isPrimaryEarlier = !isCombined || !secondaryExam || (getChronologicalWeight(exam) <= getChronologicalWeight(secondaryExam));
  const term1Exam = isPrimaryEarlier ? exam : secondaryExam;
  const term2Exam = isPrimaryEarlier ? secondaryExam : exam;
  const t1Result = isPrimaryEarlier ? result : secondaryResult;
  const t2Result = isPrimaryEarlier ? secondaryResult : result;

  // Class config for ordering
  const classConfig = term1Exam?.classConfigs?.[result.className] || term2Exam?.classConfigs?.[result.className];

  // Single-term subjects
  const singleSubjectEntries = !isCombined
    ? Object.entries(result.subjects || {}).sort(([idA, a]: any, [idB, b]: any) => {
        const orderA = (classConfig?.subjects?.[idA] as any)?.order ?? a.order ?? 99;
        const orderB = (classConfig?.subjects?.[idB] as any)?.order ?? b.order ?? 99;
        return orderA - orderB;
      })
    : [];

  // Combined-term subjects
  const allSubjectKeys = isCombined ? Array.from(new Set([
    ...Object.keys(t1Result?.subjects || {}),
    ...Object.keys(t2Result?.subjects || {})
  ])) : [];

  const combinedSubjectEntries = isCombined ? allSubjectKeys.map(id => {
    const sub1 = t1Result?.subjects?.[id];
    const sub2 = t2Result?.subjects?.[id];
    const name = sub1?.name || sub2?.name || id;
    const order = (classConfig?.subjects?.[id] as any)?.order ?? (sub1 as any)?.order ?? (sub2 as any)?.order ?? 99;
    return { id, name, order, sub1, sub2 };
  }).sort((a, b) => a.order - b.order) : [];

  const otherExams = allExams.filter(e => e.id !== examId);

  const cardTitle = isCombined && secondaryExam
    ? `COMBINED PROGRESS REPORT (${(term1Exam?.title || 'FIRST TERM').toUpperCase()} & ${(term2Exam?.title || 'FINAL TERM').toUpperCase()})`
    : `${(exam?.title || 'EXAMINATION 2026').toUpperCase()} RESULT CARD`;

  return (
    <div className="bg-slate-100 min-h-screen flex flex-col items-center py-6 print:p-0 print:m-0 font-segoe">
      {/* Screen-only Action Toolbar */}
      <div className="print:hidden w-full max-w-[840px] mb-4 flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <Button asChild variant="outline" size="sm" className="rounded-lg font-bold border-slate-300 h-9">
          <Link href={`/admin/results`}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Gazette
          </Link>
        </Button>

        {/* Multi-Term Toggle if other exams exist */}
        {otherExams.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setIsCombined(false)}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5",
                  !isCombined ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <FileText className="h-3.5 w-3.5" /> Single Term Card
              </button>
              <button
                onClick={() => setIsCombined(true)}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5",
                  isCombined ? "bg-[#0f2a4a] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Layers className="h-3.5 w-3.5" /> Combined Result
              </button>
            </div>

            {/* If combined, allow picking secondary exam */}
            {isCombined && otherExams.length > 1 && (
              <select
                value={secondaryExam?.id || ''}
                onChange={(e) => handleSelectSecondaryExam(e.target.value)}
                className="h-8 text-xs font-bold bg-white border border-slate-300 rounded-md px-2 text-slate-800 focus:outline-none"
              >
                {otherExams.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    Combine with: {ex.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <Button onClick={() => window.print()} size="sm" className="rounded-lg bg-[#0f2a4a] hover:bg-[#1e3a8a] text-white font-bold gap-1.5 shadow-sm h-9">
          <Printer className="h-3.5 w-3.5" /> Print / Save as PDF
        </Button>
      </div>

      {/* Main Report Card Container */}
      <div className="report-card-wrapper print:w-full">
        <div className="report-card">
          
          {/* Top Section */}
          <div>
            {/* 1. Header Section */}
            <div className="rc-header-section">
              <img 
                src={settings.profile?.logoURL || "https://i.postimg.cc/8PSpzG5K/tss-logo.png"} 
                className="rc-school-logo" 
                alt="Logo" 
              />
              <div className="rc-header-text">
                <div className="rc-school-title-row">
                  <h1 className="rc-school-name">THE SPIRIT SCHOOL</h1>
                  <span className="rc-campus-badge">SAMUNDRI CAMPUS</span>
                </div>
                <div className="rc-title-underline"></div>
                <p className="rc-address-text">
                  {settings.profile?.address || 'Housing Colony #2 Samundri'}
                </p>
                <div className="rc-contact-row">
                  <span>📞 0333-9114333 | 0345-9114333</span>
                  <span className="rc-sep">|</span>
                  <span>✉ tss.samundri@gmail.com</span>
                </div>
              </div>
            </div>

            {/* 2. Exam Banner */}
            <div className="rc-exam-banner">
              {cardTitle}
            </div>

            {/* 3. Student Bio Grid with Student Photo */}
            <div className="rc-student-info-grid">
              <div className="rc-info-col">
                <div className="rc-info-row">
                  <span className="rc-info-lbl">STUDENT'S NAME</span>
                  <span className="rc-info-colon">:</span>
                  <span className="rc-info-val">{result.studentName}</span>
                </div>
                <div className="rc-info-row">
                  <span className="rc-info-lbl">ROLL NUMBER</span>
                  <span className="rc-info-colon">:</span>
                  <span className="rc-info-val font-bold">{result.rollNumber}</span>
                </div>
                <div className="rc-info-row">
                  <span className="rc-info-lbl">SECTION</span>
                  <span className="rc-info-colon">:</span>
                  <span className="rc-info-val">{result.sectionName}</span>
                </div>
              </div>

              <div className="rc-info-col">
                <div className="rc-info-row">
                  <span className="rc-info-lbl">FATHER'S NAME</span>
                  <span className="rc-info-colon">:</span>
                  <span className="rc-info-val">{student?.fatherName || '—'}</span>
                </div>
                <div className="rc-info-row">
                  <span className="rc-info-lbl">CLASS</span>
                  <span className="rc-info-colon">:</span>
                  <span className="rc-info-val">{displayClassName}</span>
                </div>
                <div className="rc-info-row">
                  <span className="rc-info-lbl">ACADEMIC YEAR</span>
                  <span className="rc-info-colon">:</span>
                  <span className="rc-info-val">2026</span>
                </div>
              </div>

              <div className="rc-photo-frame">
                <img src={displayPhoto} className="w-full h-full object-cover" alt={result.studentName} />
              </div>
            </div>

            {/* 4. Detail Marks Table (NO PASS MARKS COLUMN) */}
            {isCombined ? (
              <table className="rc-marks-table">
                <thead>
                  <tr>
                    <th rowSpan={2} style={{ width: '38px' }}>S#</th>
                    <th rowSpan={2} style={{ textAlign: 'left', paddingLeft: '12px' }}>Subject Name</th>
                    <th colSpan={2} style={{ background: '#e2e8f0', color: '#0f2a4a' }}>
                      {(term1Exam?.title || '1ST TERM').toUpperCase()}
                    </th>
                    <th colSpan={2} style={{ background: '#e2e8f0', color: '#0f2a4a' }}>
                      {(term2Exam?.title || 'FINAL TERM').toUpperCase()}
                    </th>
                    <th colSpan={4} style={{ background: '#0f2a4a', color: '#ffffff' }}>
                      COMBINED ANNUAL RESULT
                    </th>
                  </tr>
                  <tr>
                    <th style={{ width: '54px' }}>Obt.</th>
                    <th style={{ width: '54px' }}>Total</th>
                    <th style={{ width: '54px' }}>Obt.</th>
                    <th style={{ width: '54px' }}>Total</th>
                    <th style={{ width: '58px', background: '#1e3a8a', color: '#fff' }}>Obt.</th>
                    <th style={{ width: '56px' }}>Total</th>
                    <th style={{ width: '56px' }}>%</th>
                    <th style={{ width: '54px' }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {combinedSubjectEntries.map((item, idx) => {
                    const t1Marks = item.sub1 ? Number(item.sub1.marks || 0) : null;
                    const t1Max = item.sub1 ? Number(item.sub1.maxMarks || 50) : 0;
                    const t2Marks = item.sub2 ? Number(item.sub2.marks || 0) : null;
                    const t2Max = item.sub2 ? Number(item.sub2.maxMarks || 50) : 0;
                    const combinedObt = Number(((t1Marks || 0) + (t2Marks || 0)).toFixed(1));
                    const combinedSubMax = t1Max + t2Max;
                    const pct = combinedSubMax > 0 ? ((combinedObt / combinedSubMax) * 100).toFixed(1) : '0';
                    const numPct = Number(pct);
                    const scale = settings?.gradingScale || [];
                    const matchedGrade = scale.find(g => numPct >= g.min);
                    const subGrade = matchedGrade?.grade || (numPct >= 80 ? 'A+' : numPct >= 70 ? 'A' : numPct >= 60 ? 'B' : numPct >= 50 ? 'C' : 'F');

                    return (
                      <tr key={item.id}>
                        <td className="text-center font-bold">{idx + 1}</td>
                        <td className="subj-name-col">{item.name}</td>
                        <td className="text-center font-bold">{t1Marks !== null ? t1Marks : '—'}</td>
                        <td className="text-center font-bold">{t1Max > 0 ? t1Max : '—'}</td>
                        <td className="text-center font-bold">{t2Marks !== null ? t2Marks : '—'}</td>
                        <td className="text-center font-bold">{t2Max > 0 ? t2Max : '—'}</td>
                        <td className="text-center font-bold rc-subj-pct-cell">{combinedObt}</td>
                        <td className="text-center font-bold">{combinedSubMax}</td>
                        <td className="text-center font-bold">{pct}%</td>
                        <td className="text-center font-bold">{subGrade}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #0f2a4a' }}>
                    <td colSpan={2} style={{ textAlign: 'center', fontWeight: 800, padding: '7px 8px', color: '#0f2a4a' }}>
                      GRAND TOTAL
                    </td>
                    <td className="text-center font-bold">{t1Result ? t1Result.totalObtained : '—'}</td>
                    <td className="text-center font-bold">{t1Result ? t1Result.totalMax : '—'}</td>
                    <td className="text-center font-bold">{t2Result ? t2Result.totalObtained : '—'}</td>
                    <td className="text-center font-bold">{t2Result ? t2Result.totalMax : '—'}</td>
                    <td className="text-center font-bold rc-subj-pct-cell" style={{ fontSize: '13.5px' }}>{combinedTotalObtained}</td>
                    <td className="text-center font-bold">{combinedTotalMax}</td>
                    <td className="text-center font-bold">{combinedPercentage}%</td>
                    <td className="text-center font-bold" style={{ fontSize: '13.5px' }}>{combinedGrade}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <table className="rc-marks-table">
                <thead>
                  <tr>
                    <th style={{ width: '45px' }}>S#</th>
                    <th style={{ textAlign: 'left', paddingLeft: '14px' }}>Subject Name</th>
                    <th style={{ width: '90px' }}>Total Marks</th>
                    <th style={{ width: '95px' }}>Marks Obtained</th>
                    <th style={{ width: '90px' }}>Percentage (%)</th>
                    <th style={{ width: '80px' }}>Status</th>
                    <th style={{ width: '130px', textAlign: 'left', paddingLeft: '12px' }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {singleSubjectEntries.map(([id, sub]: any, idx) => {
                    const maxM = Number(sub.maxMarks || 50);
                    const obtM = Number(sub.marks || 0);
                    const pct = maxM > 0 ? ((obtM / maxM) * 100).toFixed(1) : '0';
                    const passPct = exam?.passPercentage || 33;
                    const isPass = Number(pct) >= passPct;
                    const remark = getGradeRemark(sub.grade, Number(pct));

                    return (
                      <tr key={id}>
                        <td className="text-center font-bold">{idx + 1}</td>
                        <td className="subj-name-col">{sub.name}</td>
                        <td className="text-center font-bold">{maxM}</td>
                        <td className="text-center font-bold">{obtM}</td>
                        <td className="text-center font-bold rc-subj-pct-cell">{pct}%</td>
                        <td className="text-center">
                          <span className={cn("rc-table-status-pill", isPass ? "pass" : "fail")}>
                            {isPass ? "PASS" : "FAIL"}
                          </span>
                        </td>
                        <td className="rc-subj-remark-cell">{remark}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #0f2a4a' }}>
                    <td colSpan={2} style={{ textAlign: 'center', fontWeight: 800, padding: '7px 8px', color: '#0f2a4a' }}>
                      GRAND TOTAL
                    </td>
                    <td className="text-center font-bold">{result.totalMax}</td>
                    <td className="text-center font-bold rc-subj-pct-cell" style={{ fontSize: '13.5px' }}>{result.totalObtained}</td>
                    <td className="text-center font-bold rc-subj-pct-cell">{result.percentage}%</td>
                    <td className="text-center">
                      <span className={cn("rc-table-status-pill", (result.status || 'Pass') === 'Pass' ? "pass" : "fail")}>
                        {(result.status || 'Pass').toUpperCase()}
                      </span>
                    </td>
                    <td className="rc-subj-remark-cell font-bold">{getGradeRemark(result.grade, result.percentage)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Bottom Section (Anchored to fill the A4 page) */}
          <div className="rc-bottom-block">
            {/* 5. Side-by-Side Summary & Grading Criteria Container */}
            <div className="rc-bottom-container">
              {/* Left: Summary Table */}
              <table className="rc-summary-table">
                <tbody>
                  <tr>
                    <td className="rc-sum-lbl">Total Marks:</td>
                    <td className="rc-sum-val"><strong>{combinedTotalObtained} / {combinedTotalMax}</strong></td>
                  </tr>
                  <tr>
                    <td className="rc-sum-lbl">Percentage (%):</td>
                    <td className="rc-sum-val"><strong>{combinedPercentage}%</strong></td>
                  </tr>
                  <tr>
                    <td className="rc-sum-lbl">Overall Grade:</td>
                    <td className="rc-sum-val"><strong>{combinedGrade}</strong></td>
                  </tr>
                  <tr>
                    <td className="rc-sum-lbl">Class Position:</td>
                    <td className="rc-sum-val">
                      <span className="rc-position-pill">{dynamicPosition}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="rc-sum-lbl">Result Status:</td>
                    <td className="rc-sum-val">
                      <span className={cn("rc-table-status-pill", (combinedStatus || 'Pass') === 'Pass' ? "pass" : "fail")}>
                        {(combinedStatus || 'Pass').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Right: Institutional Grading Criteria Table */}
              <table className="rc-grading-table">
                <thead>
                  <tr>
                    <th>Grade</th>
                    <th>Percentage Range</th>
                    <th>Standard</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-center font-bold">A+</td>
                    <td className="text-center">80% – 100%</td>
                    <td className="text-center">Outstanding</td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">A</td>
                    <td className="text-center">70% – 79.9%</td>
                    <td className="text-center">Excellent</td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">B</td>
                    <td className="text-center">60% – 69.9%</td>
                    <td className="text-center">Very Good</td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">C</td>
                    <td className="text-center">50% – 59.9%</td>
                    <td className="text-center">Good</td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">D</td>
                    <td className="text-center">40% – 49.9%</td>
                    <td className="text-center">Satisfactory</td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">F</td>
                    <td className="text-center">Below 40%</td>
                    <td className="text-center">Needs Attention</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 6. Principal & Teacher Remarks Table */}
            <table className="rc-remarks-table">
              <thead>
                <tr>
                  <th>Principal &amp; Teacher Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>"{autoRemark}"</td>
                </tr>
              </tbody>
            </table>

            {/* 7. 3-Column Signatures Row */}
            <div className="rc-footer-signatures">
              <div className="rc-sig-col">
                <div className="rc-sig-line"></div>
                <div className="rc-sig-title">Class Teacher</div>
              </div>
              <div className="rc-sig-col">
                <div className="rc-sig-line"></div>
                <div className="rc-sig-title">Controller of Examination</div>
              </div>
              <div className="rc-sig-col">
                {settings.profile?.principalSignatureURL && (
                  <img src={settings.profile.principalSignatureURL} className="absolute bottom-6 left-1/2 -translate-x-1/2 h-9 object-contain" alt="Signature" />
                )}
                <div className="rc-sig-line"></div>
                <div className="rc-sig-title">Principal</div>
              </div>
            </div>

            {/* 8. Footer Integrity Line */}
            <div className="rc-integrity-footer">
              © 2026 THE SPIRIT SCHOOL SAMUNDRI CAMPUS • OFFICIAL RESULT • PRINTED ON {format(new Date(), 'dd MMMM yyyy').toUpperCase()}
            </div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        :root {
          --navy: #0f2a4a;
          --navy-light: #1e3a8a;
          --crimson: #dc2626;
          --text: #0f172a;
          --text-muted: #475569;
          --border-dark: #0f2a4a;
          --border-gray: #cbd5e1;
          --border-light: #e2e8f0;
          --bg-table-header: #f8fafc;
          --pass-bg: #e6f9ed;
          --pass-color: #15803d;
          --pass-border: #22c55e;
          --fail-bg: #fee2e2;
          --fail-color: #dc2626;
          --fail-border: #f87171;
        }

        .font-segoe {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        }

        .report-card-wrapper {
          width: 100%;
          max-width: 840px;
          display: flex;
          justify-content: center;
        }

        .report-card {
          background: #ffffff;
          width: 100%;
          border: 2.5px solid var(--border-dark);
          border-radius: 8px;
          padding: 28px 36px 20px 36px;
          box-shadow: 0 10px 35px rgba(15, 42, 74, 0.10);
          box-sizing: border-box;
          position: relative;
          min-height: 280mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .rc-header-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 12px;
        }

        .rc-school-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
          flex-shrink: 0;
        }

        .rc-header-text {
          flex: 1;
          text-align: center;
        }

        .rc-school-title-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .rc-school-name {
          font-size: 27px;
          font-weight: 900;
          color: var(--navy);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          line-height: 1.1;
          margin: 0;
        }

        .rc-campus-badge {
          background: var(--crimson);
          color: #ffffff;
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: 0.06em;
          padding: 3px 10px;
          border-radius: 4px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .rc-title-underline {
          height: 2.5px;
          background: var(--navy);
          margin: 6px auto 5px auto;
          width: 82%;
        }

        .rc-address-text {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          margin-top: 2px;
        }

        .rc-contact-row {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 3px;
        }

        .rc-contact-row .rc-sep {
          color: #94a3b8;
        }

        .rc-exam-banner {
          background: var(--navy);
          color: #ffffff;
          text-align: center;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 8px 14px;
          margin: 10px 0 14px 0;
          border-radius: 4px;
          box-shadow: 0 2px 6px rgba(15, 42, 74, 0.15);
        }

        .rc-student-info-grid {
          display: flex;
          gap: 20px;
          margin-bottom: 14px;
          align-items: center;
        }

        .rc-info-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .rc-info-row {
          display: flex;
          align-items: flex-end;
          gap: 6px;
        }

        .rc-info-lbl {
          font-size: 12.5px;
          font-weight: 800;
          color: var(--navy);
          letter-spacing: 0.03em;
          text-transform: uppercase;
          width: 125px;
          flex-shrink: 0;
        }

        .rc-info-colon {
          font-size: 12.5px;
          font-weight: 800;
          color: var(--navy);
          margin-right: 4px;
        }

        .rc-info-val {
          font-size: 13.5px;
          font-weight: 700;
          color: #000000;
          border-bottom: 1.5px solid var(--navy);
          flex: 1;
          padding: 1px 6px;
          text-transform: uppercase;
          min-height: 23px;
          line-height: 1.3;
        }

        .rc-photo-frame {
          width: 90px;
          height: 114px;
          border: 1.5px solid var(--navy);
          border-radius: 4px;
          flex-shrink: 0;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 2px 6px rgba(15, 42, 74, 0.08);
        }

        .rc-marks-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
          margin-bottom: 14px;
          border: 2px solid var(--navy);
          background: #ffffff;
        }

        .rc-marks-table th {
          background: var(--bg-table-header);
          color: var(--navy);
          font-weight: 800;
          font-size: 12px;
          border: 1px solid var(--navy);
          padding: 7px 5px;
          text-align: center;
          line-height: 1.25;
        }

        .rc-marks-table td {
          border: 1px solid var(--border-gray);
          padding: 6.5px 6px;
          font-size: 12.5px;
          line-height: 1.35;
          font-weight: 600;
        }

        .rc-marks-table .subj-name-col {
          text-align: left;
          padding-left: 12px;
          font-weight: 800;
          color: var(--navy);
          text-transform: uppercase;
        }

        .rc-marks-table .text-center {
          text-align: center;
        }

        .rc-marks-table .font-bold {
          font-weight: 700;
        }

        .rc-subj-pct-cell {
          color: var(--navy);
          font-weight: 800;
          text-align: center;
        }

        .rc-subj-remark-cell {
          text-align: left;
          padding-left: 10px;
          font-size: 12px;
          font-weight: 700;
          color: #1e293b;
        }

        .rc-table-status-pill {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          line-height: 1.35;
          text-transform: uppercase;
        }

        .rc-table-status-pill.pass {
          background: var(--pass-bg);
          color: var(--pass-color);
          border: 1.5px solid var(--pass-border);
        }

        .rc-table-status-pill.fail {
          background: var(--fail-bg);
          color: var(--fail-color);
          border: 1.5px solid var(--fail-border);
        }

        .rc-bottom-block {
          display: flex;
          flex-direction: column;
          flex: 1;
          margin-top: 14px;
        }

        .rc-bottom-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 10px;
          align-items: stretch;
        }

        .rc-summary-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid var(--navy);
          background: #ffffff;
        }

        .rc-summary-table td {
          border: 1px solid var(--border-gray);
          padding: 6px 12px;
          font-size: 12.5px;
        }

        .rc-summary-table .rc-sum-lbl {
          font-weight: 700;
          color: var(--navy);
          width: 44%;
          text-align: left;
        }

        .rc-summary-table .rc-sum-val {
          text-align: center;
          font-weight: 800;
          font-size: 13px;
        }

        .rc-position-pill {
          background: #fef9c3;
          color: #854d0e;
          border: 1.5px solid #f59e0b;
          border-radius: 4px;
          padding: 2px 12px;
          font-weight: 800;
          font-size: 12px;
          display: inline-block;
        }

        .rc-grading-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid var(--navy);
          background: #ffffff;
        }

        .rc-grading-table th {
          background: var(--bg-table-header);
          color: var(--navy);
          font-weight: 800;
          font-size: 11.5px;
          border: 1px solid var(--border-gray);
          padding: 5px 6px;
          text-align: center;
        }

        .rc-grading-table td {
          border: 1px solid var(--border-gray);
          padding: 4px 5px;
          font-size: 11.5px;
          text-align: center;
          font-weight: 600;
        }

        .rc-grading-table td.font-bold {
          font-weight: 800;
          color: var(--navy);
        }

        .rc-remarks-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid var(--navy);
          background: #ffffff;
          margin: 0 0 10px 0;
        }

        .rc-remarks-table th {
          background: var(--bg-table-header);
          color: var(--navy);
          font-weight: 800;
          font-size: 11.5px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border-bottom: 1.5px solid var(--navy);
          padding: 6px 14px;
          text-align: left;
        }

        .rc-remarks-table td {
          padding: 9px 14px;
          font-size: 12.5px;
          font-weight: 600;
          color: #334155;
          line-height: 1.45;
          font-style: italic;
          border: none;
          text-align: center;
        }

        .rc-footer-signatures {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: auto;
          margin-bottom: 6px;
          padding: 0 8px;
        }

        .rc-sig-col {
          width: 29%;
          text-align: center;
          position: relative;
        }

        .rc-sig-line {
          border-bottom: 1.5px solid var(--navy);
          height: 60px;
          width: 100%;
          margin-bottom: 8px;
        }

        .rc-sig-title {
          font-size: 12.5px;
          font-weight: 800;
          color: var(--navy);
        }

        .rc-integrity-footer {
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          padding-top: 10px;
          border-top: 1px solid var(--border-light);
          margin-top: 8px;
        }

        /* ── PRINT MEDIA QUERY (PERFECT A4 FIT, ZERO BOTTOM GAP) ── */
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }

          body {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print\\:hidden, .no-print {
            display: none !important;
          }

          .report-card-wrapper {
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            height: 283mm !important;
          }

          .report-card {
            border: 2px solid #0f2a4a !important;
            box-shadow: none !important;
            padding: 5mm 8mm 4mm 8mm !important;
            width: 100% !important;
            height: 283mm !important;
            max-height: 283mm !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }

          .rc-header-section {
            margin-bottom: 2.5mm !important;
          }

          .rc-school-logo {
            width: 18mm !important;
            height: 18mm !important;
          }

          .rc-school-name {
            font-size: 20pt !important;
          }

          .rc-campus-badge {
            font-size: 9.5pt !important;
            padding: 2pt 8pt !important;
          }

          .rc-exam-banner {
            font-size: 12pt !important;
            padding: 4.5pt 10pt !important;
            margin: 2mm 0 3mm 0 !important;
          }

          .rc-student-info-grid {
            margin-bottom: 3mm !important;
          }

          .rc-info-lbl {
            font-size: 9.5pt !important;
            width: 33mm !important;
          }

          .rc-info-val {
            font-size: 10pt !important;
            min-height: 5mm !important;
          }

          .rc-photo-frame {
            width: 23mm !important;
            height: 29mm !important;
          }

          .rc-marks-table {
            margin-bottom: 3mm !important;
          }

          .rc-marks-table th {
            font-size: 9pt !important;
            padding: 4pt 3.5pt !important;
          }

          .rc-marks-table td {
            font-size: 9.5pt !important;
            padding: 3.5pt 4pt !important;
          }

          .rc-bottom-block {
            display: flex !important;
            flex-direction: column !important;
            flex: 1 !important;
            margin-top: 3.5mm !important;
          }

          .rc-bottom-container {
            margin-bottom: 2.5mm !important;
          }

          .rc-summary-table td {
            font-size: 9pt !important;
            padding: 3pt 6pt !important;
          }

          .rc-grading-table th {
            font-size: 8.5pt !important;
            padding: 3pt 4pt !important;
          }

          .rc-grading-table td {
            font-size: 8.2pt !important;
            padding: 2.5pt 4pt !important;
          }

          .rc-remarks-table {
            margin: 0 0 2.5mm 0 !important;
          }

          .rc-remarks-table th {
            font-size: 8.5pt !important;
            padding: 2.5pt 6pt !important;
          }

          .rc-remarks-table td {
            font-size: 9pt !important;
            padding: 3.5pt 6pt !important;
          }

          .rc-footer-signatures {
            margin-top: auto !important;
            margin-bottom: 1.5mm !important;
          }

          .rc-sig-line {
            height: 16mm !important;
          }

          .rc-sig-title {
            font-size: 9pt !important;
          }

          .rc-integrity-footer {
            font-size: 8.5pt !important;
            padding-top: 2mm !important;
          }
        }
      `}</style>
    </div>
  );
}
