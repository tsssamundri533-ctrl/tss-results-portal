import { Result, Student, Exam, SchoolSettings, RemarksConfig } from '@/types';
import { format } from 'date-fns';

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

/**
 * Standard remarks for individual grades in ledger rows
 */
export function getGradeRemark(grade?: string, percentage?: number): string {
  const g = (grade || '').toUpperCase().trim();
  if (g === 'A+' || (percentage !== undefined && percentage >= 80)) return 'Outstanding';
  if (g === 'A' || (percentage !== undefined && percentage >= 70)) return 'Excellent';
  if (g === 'B' || (percentage !== undefined && percentage >= 60)) return 'Very Good';
  if (g === 'C' || (percentage !== undefined && percentage >= 50)) return 'Good';
  if (g === 'D' || (percentage !== undefined && percentage >= 40)) return 'Satisfactory';
  return 'Needs Attention';
}

const BOILERPLATE_REMARKS = new Set([
  'Truly exceptional academic performance and dedication.',
  'Highly commendable results.',
  'Solid and consistent performance.',
  'Satisfactory results. Strive for better.',
  'Hard work is required to improve.',
  'Urgent attention and revision required.',
  'Performance Synchronized.',
  'Truly exceptional academic performance and dedication. Keep it up!',
  'Highly commendable results and strong analytical skills shown.',
  'Solid performance with consistent focus on the curriculum.',
  'Satisfactory results. Strive for even better conceptual clarity.',
  'A fair effort, but more hard work is required to improve the grade.',
  'Needs immediate attention and focused parental guidance.',
  'Needs Improvement',
  'Outstanding performance! An exceptional student with strong academic consistency, brilliant analytical understanding, and exemplary discipline. Keep up the high standards.'
]);

export const DEFAULT_REMARKS_CONFIG: RemarksConfig = {
  singleTerm: {
    firstPosition: "Outstanding performance! Clinched 1st Position in class with exceptional dedication, brilliant conceptual understanding, and exemplary discipline. Keep shining!",
    secondPosition: "Brilliant academic performance! Secured 2nd Position in class with remarkable intellectual ability and consistent hard work. Keep aiming for the pinnacle!",
    thirdPosition: "Heartiest congratulations on securing 3rd Position in class! Exhibited commendable academic drive, strong work ethic, and keen intellect. Well done!",
    topTen: "Excellent academic performance! Ranked among the top achievers of the class with thorough subject grasp and commendable self-discipline. Strive for top positions!",
    gradeAPlus: "Exceptional overall academic performance! Displays great enthusiasm for learning, thorough conceptual mastery, and remarkable discipline. A top-tier result!",
    gradeA: "Very good overall result! Shows clear understanding of concepts and reliable study habits. With focused revision in core areas, an A+ is well within reach.",
    gradeB: "Good overall performance. Shows solid academic potential. Greater consistency, regular revision, and daily practice will boost grades significantly.",
    gradeC: "Satisfactory overall effort, but significant hard work is required. Regular homework review, attentive classroom participation, and revision of fundamentals are essential.",
    gradeD: "Fair effort, but overall performance remains near the passing threshold. Needs intensive hard work, disciplined daily study hours, and parental supervision.",
    fail: "Overall performance is below the expected benchmark. Needs immediate attention, daily supervised study, and serious hard work to improve."
  },
  combinedTerm: {
    firstPosition: "Phenomenal annual accomplishment! Clinched 1st Position in class with peerless academic consistency, superior intellect, and exemplary discipline. Promoted with highest distinction!",
    secondPosition: "Brilliant annual achievement! Secured 2nd Position in class through commendable perseverance, sharp analytical acumen, and steady hard work. Promoted with high distinction!",
    thirdPosition: "Heartiest congratulations on securing 3rd Position in class! Exhibited commendable academic drive and consistent focus across both terms. Promoted with great merit!",
    topTen: "Outstanding annual progress! Maintained top-tier academic standing with impressive conceptual mastery across both terms. Promoted with distinction!",
    gradeAPlus: "Very strong annual performance! Maintained consistent focus and achieved high academic standards throughout the year. Promoted with distinction!",
    gradeA: "Very good annual achievement! Displayed steady progress and sound conceptual understanding across both terms. Promoted with good standing!",
    gradeB: "Good annual effort! Showed consistent improvement throughout the session. Continued diligence and regular practice will lead to higher honors.",
    gradeC: "Promoted with satisfactory overall progress. Needs to build a more structured study routine and put in serious hard work in the upcoming academic session.",
    gradeD: "Promoted on borderline progress. Requires intensive holiday revision, focused parental guidance, and dedicated hard work to keep pace next year.",
    fail: "Did not meet the promotion criteria. Immediate consultation with the school administration and remedial coaching are strongly recommended."
  }
};

export interface DynamicRemarksParams {
  manualRemarks?: string | null;
  percentage: number;
  grade: string;
  positionStr: string;
  status?: string;
  isCombined?: boolean;
  remarksConfig?: RemarksConfig | null;
}

/**
 * Generate 100% dynamic, individualized, position-aware and grade-aware Principal & Teacher Remarks
 * based strictly on the student's OVERALL academic standing.
 */
export function getDynamicRemarks({
  manualRemarks,
  percentage,
  grade,
  positionStr,
  status,
  isCombined,
  remarksConfig
}: DynamicRemarksParams): string {
  // If the teacher has typed a custom personal note that is NOT an automated boilerplate, prioritize it!
  if (manualRemarks && manualRemarks.trim().length > 0 && !BOILERPLATE_REMARKS.has(manualRemarks.trim())) {
    return manualRemarks.trim();
  }

  const pct = Number(percentage || 0);
  const pos = (positionStr || '').trim();
  const isFail = (status || '').toLowerCase() === 'fail' || pct < 33 || grade === 'F';

  const cfg = (isCombined ? remarksConfig?.combinedTerm : remarksConfig?.singleTerm) 
    || (isCombined ? DEFAULT_REMARKS_CONFIG.combinedTerm : DEFAULT_REMARKS_CONFIG.singleTerm);

  if (isFail) {
    return cfg.fail || DEFAULT_REMARKS_CONFIG[isCombined ? 'combinedTerm' : 'singleTerm'].fail;
  }

  // Elite recognition for Top 3 positions
  if (pos.startsWith('1st')) {
    return cfg.firstPosition || DEFAULT_REMARKS_CONFIG[isCombined ? 'combinedTerm' : 'singleTerm'].firstPosition;
  }

  if (pos.startsWith('2nd')) {
    return cfg.secondPosition || DEFAULT_REMARKS_CONFIG[isCombined ? 'combinedTerm' : 'singleTerm'].secondPosition;
  }

  if (pos.startsWith('3rd')) {
    return cfg.thirdPosition || DEFAULT_REMARKS_CONFIG[isCombined ? 'combinedTerm' : 'singleTerm'].thirdPosition;
  }

  // Top 10 High Achievers (Grade A+ or >= 80% with Top 10 rank)
  const rankNum = parseInt(pos);
  if (!isNaN(rankNum) && rankNum <= 10 && pct >= 80) {
    return cfg.topTen || DEFAULT_REMARKS_CONFIG[isCombined ? 'combinedTerm' : 'singleTerm'].topTen;
  }

  // Grade A+ (80% - 100%)
  if (pct >= 80 || grade === 'A+') {
    return cfg.gradeAPlus || DEFAULT_REMARKS_CONFIG[isCombined ? 'combinedTerm' : 'singleTerm'].gradeAPlus;
  }

  // Grade A (70% - 79.9%)
  if (pct >= 70 || grade === 'A') {
    return cfg.gradeA || DEFAULT_REMARKS_CONFIG[isCombined ? 'combinedTerm' : 'singleTerm'].gradeA;
  }

  // Grade B (60% - 69.9%)
  if (pct >= 60 || grade === 'B') {
    return cfg.gradeB || DEFAULT_REMARKS_CONFIG[isCombined ? 'combinedTerm' : 'singleTerm'].gradeB;
  }

  // Grade C (50% - 59.9%)
  if (pct >= 50 || grade === 'C') {
    return cfg.gradeC || DEFAULT_REMARKS_CONFIG[isCombined ? 'combinedTerm' : 'singleTerm'].gradeC;
  }

  // Grade D (40% - 49.9%)
  if (pct >= 40 || grade === 'D') {
    return cfg.gradeD || DEFAULT_REMARKS_CONFIG[isCombined ? 'combinedTerm' : 'singleTerm'].gradeD;
  }

  // Marginal pass (33% - 39.9%)
  return cfg.fail || DEFAULT_REMARKS_CONFIG[isCombined ? 'combinedTerm' : 'singleTerm'].fail;
}

export interface BatchPrintOptions {
  isCombined?: boolean;
  secondaryExam?: Exam | null;
  secondaryResults?: Result[];
  allClassResults?: Result[];
  allSecondaryClassResults?: Result[];
}

/**
 * Resolve chronological weight of an exam to ensure earlier terms (e.g. First Term)
 * always precede subsequent terms (e.g. Final Term) on Combined Progress Reports.
 */
export function getChronologicalWeight(examObj: Exam | null | undefined): number {
  if (!examObj) return 99;
  const t = (examObj.examTypeId || '').toLowerCase();
  const title = (examObj.title || '').toLowerCase();
  
  if (t === 'first-term' || title.includes('first') || title.includes('1st')) return 1;
  if (t === 'second-term' || t === 'mid-term' || title.includes('second') || title.includes('2nd') || title.includes('mid')) return 2;
  if (title.includes('third') || title.includes('3rd')) return 3;
  if (t === 'final-term' || t === 'annual' || title.includes('final') || title.includes('annual')) return 4;
  
  if (examObj.createdAt) {
    const time = new Date(examObj.createdAt).getTime();
    if (!isNaN(time)) return time;
  }
  return 50;
}

/**
 * Institutional A4 Result Card Template - The Spirit School Samundri
 * 100% Geometry, Single-Page Fit, and Typography Match with result-card.html.
 * Includes 100% Dynamic Class Position Calculation across the entire class.
 */
export async function generateResultsBatchHtml(
  results: Result[], 
  students: Student[], 
  exam: Exam, 
  settings: SchoolSettings,
  options?: BatchPrintOptions
) {
  const isCombined = !!options?.isCombined && !!options?.secondaryExam;
  const secondaryExam = options?.secondaryExam;
  const secondaryResults = options?.secondaryResults || [];

  // Chronologically resolve which exam is Term 1 (earlier) and which is Term 2 (later)
  const isPrimaryEarlier = !isCombined || !secondaryExam || (getChronologicalWeight(exam) <= getChronologicalWeight(secondaryExam));
  const term1Exam = isPrimaryEarlier ? exam : secondaryExam;
  const term2Exam = isPrimaryEarlier ? secondaryExam : exam;

  // Use full class results for accurate class ranking if provided, otherwise fallback to target results
  const rankingSource = (options?.allClassResults && options.allClassResults.length > 0)
    ? options.allClassResults
    : results;
  const secondaryRankingSource = (options?.allSecondaryClassResults && options.allSecondaryClassResults.length > 0)
    ? options.allSecondaryClassResults
    : secondaryResults;

  // Precompute dynamic class positions for every student across their entire class
  const positionMap = new Map<string, string>();

  // Group rankingSource by className
  const classGroups = new Map<string, Result[]>();
  rankingSource.forEach(r => {
    const cls = r.className || 'default';
    if (!classGroups.has(cls)) classGroups.set(cls, []);
    classGroups.get(cls)!.push(r);
  });

  classGroups.forEach((clsResults) => {
    if (isCombined && secondaryRankingSource.length > 0) {
      const scoredList = clsResults.map(r1 => {
        const r2 = secondaryRankingSource.find(r => r.studentId === r1.studentId);
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
        positionMap.set(scoredList[i].studentId, `${getOrdinal(currentRank)} Position`);
      }
    } else {
      const scoredList = clsResults.map(r => {
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
        positionMap.set(scoredList[i].studentId, `${getOrdinal(currentRank)} Position`);
      }
    }
  });

  const pages = results.map((result) => {
    const student = students.find(s => s.id === result.studentId);
    const academicYear = '2026';
    const gender = result.gender || student?.gender || 'male';
    const displayPhoto = result.photoURL || student?.photoURL || (gender === 'female' ? FEMALE_AVATAR : MALE_AVATAR);
    
    // Class name formatting (e.g. 'Class 3' -> 'THREE', 'Class 4' -> 'FOUR')
    const rawClass = (result.className || '').replace(/Class\s*/i, '').trim();
    const displayClassName = NUM_TO_WORD[rawClass] || rawClass.toUpperCase() || 'THREE';

    // If combined mode, find student's secondary result (e.g. final or 2nd term)
    const secResult = isCombined 
      ? secondaryResults.find(r => r.studentId === result.studentId) 
      : null;

    // Chronologically resolve which result belongs to Term 1 (earlier) and Term 2 (later)
    const t1Result = isPrimaryEarlier ? result : secResult;
    const t2Result = isPrimaryEarlier ? secResult : result;

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

    // Compute combined statistics if combined mode
    let combinedTotalObtained = result.totalObtained;
    let combinedTotalMax = result.totalMax;
    let combinedPercentage = result.percentage;
    let combinedGrade = result.grade;
    let combinedStatus = result.status;

    if (isCombined && secResult) {
      combinedTotalObtained = Number((result.totalObtained + secResult.totalObtained).toFixed(1));
      combinedTotalMax = result.totalMax + secResult.totalMax;
      combinedPercentage = combinedTotalMax > 0 
        ? Number(((combinedTotalObtained / combinedTotalMax) * 100).toFixed(1))
        : 0;

      const scale = settings?.gradingScale || [];
      const matchedGrade = scale.find(g => combinedPercentage >= g.min);
      combinedGrade = matchedGrade?.grade || (combinedPercentage >= 80 ? 'A+' : combinedPercentage >= 70 ? 'A' : combinedPercentage >= 60 ? 'B' : combinedPercentage >= 50 ? 'C' : 'F');
      combinedStatus = combinedPercentage >= (exam.passPercentage || 33) ? 'Pass' : 'Fail';
    }

    // Dynamic Position from complete class ranking
    const positionDisplay = positionMap.get(result.studentId) || '—';

    // 100% Dynamic, Individualized, Position-Aware Remarks based strictly on OVERALL result
    const autoRemark = getDynamicRemarks({
      manualRemarks: result.remarks,
      percentage: isCombined ? combinedPercentage : result.percentage,
      grade: isCombined ? combinedGrade : result.grade,
      positionStr: positionDisplay,
      status: isCombined ? combinedStatus : result.status,
      isCombined,
      remarksConfig: settings?.remarksConfig
    });

    const cardTitle = isCombined && secondaryExam
      ? `COMBINED PROGRESS REPORT (${(term1Exam?.title || 'FIRST TERM').toUpperCase()} & ${(term2Exam?.title || 'FINAL TERM').toUpperCase()})`
      : `${(exam?.title || 'EXAMINATION 2026').toUpperCase()} RESULT CARD`;

    return `
      <div class="report-card-wrapper page-break">
        <div class="report-card">
          
          <!-- Top Section -->
          <div>
            <!-- 1. Header Section -->
            <div class="rc-header-section">
              <img 
                src="${settings.profile?.logoURL || "https://i.postimg.cc/8PSpzG5K/tss-logo.png"}" 
                class="rc-school-logo" 
                alt="Logo" 
              />
              <div class="rc-header-text">
                <div class="rc-school-title-row">
                  <h1 class="rc-school-name">THE SPIRIT SCHOOL</h1>
                  <span class="rc-campus-badge">SAMUNDRI CAMPUS</span>
                </div>
                <div class="rc-title-underline"></div>
                <p class="rc-address-text">${settings.profile?.address || 'Housing Colony #2 Samundri'}</p>
                <div class="rc-contact-row">
                  <span>📞 0333-9114333 | 0345-9114333</span>
                  <span class="rc-sep">|</span>
                  <span>✉ tss.samundri@gmail.com</span>
                </div>
              </div>
            </div>

            <!-- 2. Exam Banner -->
            <div class="rc-exam-banner">
              ${cardTitle}
            </div>

            <!-- 3. Student Bio Grid with Student Photo -->
            <div class="rc-student-info-grid">
              <div class="rc-info-col">
                <div class="rc-info-row">
                  <span class="rc-info-lbl">STUDENT'S NAME</span>
                  <span class="rc-info-colon">:</span>
                  <span class="rc-info-val">${result.studentName}</span>
                </div>
                <div class="rc-info-row">
                  <span class="rc-info-lbl">ROLL NUMBER</span>
                  <span class="rc-info-colon">:</span>
                  <span class="rc-info-val font-bold">${result.rollNumber}</span>
                </div>
                <div class="rc-info-row">
                  <span class="rc-info-lbl">SECTION</span>
                  <span class="rc-info-colon">:</span>
                  <span class="rc-info-val">${result.sectionName}</span>
                </div>
              </div>

              <div class="rc-info-col">
                <div class="rc-info-row">
                  <span class="rc-info-lbl">FATHER'S NAME</span>
                  <span class="rc-info-colon">:</span>
                  <span class="rc-info-val">${student?.fatherName || '—'}</span>
                </div>
                <div class="rc-info-row">
                  <span class="rc-info-lbl">CLASS</span>
                  <span class="rc-info-colon">:</span>
                  <span class="rc-info-val">${displayClassName}</span>
                </div>
                <div class="rc-info-row">
                  <span class="rc-info-lbl">ACADEMIC YEAR</span>
                  <span class="rc-info-colon">:</span>
                  <span class="rc-info-val">${academicYear}</span>
                </div>
              </div>

              <div class="rc-photo-frame">
                <img src="${displayPhoto}" class="student-photo-img" alt="${result.studentName}">
              </div>
            </div>

            <!-- 4. Detail Marks Table (NO PASS MARKS COLUMN) -->
            ${isCombined ? `
              <table class="rc-marks-table">
                <thead>
                  <tr>
                    <th rowspan="2" style="width: 38px;">S#</th>
                    <th rowspan="2" style="text-align: left; padding-left: 12px;">Subject Name</th>
                    <th colspan="2" style="background: #e2e8f0; color: #0f2a4a;">
                      ${(term1Exam?.title || '1ST TERM').toUpperCase()}
                    </th>
                    <th colspan="2" style="background: #e2e8f0; color: #0f2a4a;">
                      ${(term2Exam?.title || 'FINAL TERM').toUpperCase()}
                    </th>
                    <th colspan="4" style="background: #0f2a4a; color: #ffffff;">
                      COMBINED ANNUAL RESULT
                    </th>
                  </tr>
                  <tr>
                    <th style="width: 54px;">Obt.</th>
                    <th style="width: 54px;">Total</th>
                    <th style="width: 54px;">Obt.</th>
                    <th style="width: 54px;">Total</th>
                    <th style="width: 58px; background: #1e3a8a; color: #fff;">Obt.</th>
                    <th style="width: 56px;">Total</th>
                    <th style="width: 56px;">%</th>
                    <th style="width: 54px;">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  ${combinedSubjectEntries.map((item: any, idx: number) => {
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

                    return `
                      <tr>
                        <td class="text-center font-bold">${idx + 1}</td>
                        <td class="subj-name-col">${item.name}</td>
                        <td class="text-center font-bold">${t1Marks !== null ? t1Marks : '—'}</td>
                        <td class="text-center font-bold">${t1Max > 0 ? t1Max : '—'}</td>
                        <td class="text-center font-bold">${t2Marks !== null ? t2Marks : '—'}</td>
                        <td class="text-center font-bold">${t2Max > 0 ? t2Max : '—'}</td>
                        <td class="text-center font-bold rc-subj-pct-cell">${combinedObt}</td>
                        <td class="text-center font-bold">${combinedSubMax}</td>
                        <td class="text-center font-bold">${pct}%</td>
                        <td class="text-center font-bold">${subGrade}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
                <tfoot>
                  <tr style="background: #f8fafc; border-top: 2px solid #0f2a4a;">
                    <td colspan="2" style="text-align: center; font-weight: 800; padding: 7px 8px; color: #0f2a4a;">
                      GRAND TOTAL
                    </td>
                    <td class="text-center font-bold">${t1Result ? t1Result.totalObtained : '—'}</td>
                    <td class="text-center font-bold">${t1Result ? t1Result.totalMax : '—'}</td>
                    <td class="text-center font-bold">${t2Result ? t2Result.totalObtained : '—'}</td>
                    <td class="text-center font-bold">${t2Result ? t2Result.totalMax : '—'}</td>
                    <td class="text-center font-bold rc-subj-pct-cell" style="font-size: 13.5px;">${combinedTotalObtained}</td>
                    <td class="text-center font-bold">${combinedTotalMax}</td>
                    <td class="text-center font-bold">${combinedPercentage}%</td>
                    <td class="text-center font-bold" style="font-size: 13.5px;">${combinedGrade}</td>
                  </tr>
                </tfoot>
              </table>
            ` : `
              <table class="rc-marks-table">
                <thead>
                  <tr>
                    <th style="width: 45px;">S#</th>
                    <th style="text-align: left; padding-left: 14px;">Subject Name</th>
                    <th style="width: 90px;">Total Marks</th>
                    <th style="width: 95px;">Marks Obtained</th>
                    <th style="width: 90px;">Percentage (%)</th>
                    <th style="width: 80px;">Status</th>
                    <th style="width: 130px; text-align: left; padding-left: 12px;">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  ${singleSubjectEntries.map(([id, sub]: any, idx) => {
                    const maxM = Number(sub.maxMarks || 50);
                    const obtM = Number(sub.marks || 0);
                    const pct = maxM > 0 ? ((obtM / maxM) * 100).toFixed(1) : '0';
                    const passPct = exam?.passPercentage || 33;
                    const isPass = Number(pct) >= passPct;
                    const remark = getGradeRemark(sub.grade, Number(pct));

                    return `
                      <tr>
                        <td class="text-center font-bold">${idx + 1}</td>
                        <td class="subj-name-col">${sub.name}</td>
                        <td class="text-center font-bold">${maxM}</td>
                        <td class="text-center font-bold">${obtM}</td>
                        <td class="text-center font-bold rc-subj-pct-cell">${pct}%</td>
                        <td class="text-center">
                          <span class="rc-table-status-pill ${isPass ? 'pass' : 'fail'}">
                            ${isPass ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                        <td class="rc-subj-remark-cell">${remark}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
                <tfoot>
                  <tr style="background: #f8fafc; border-top: 2px solid #0f2a4a;">
                    <td colspan="2" style="text-align: center; font-weight: 800; padding: 7px 8px; color: #0f2a4a;">
                      GRAND TOTAL
                    </td>
                    <td class="text-center font-bold">${result.totalMax}</td>
                    <td class="text-center font-bold rc-subj-pct-cell" style="font-size: 13.5px;">${result.totalObtained}</td>
                    <td class="text-center font-bold rc-subj-pct-cell">${result.percentage}%</td>
                    <td class="text-center">
                      <span class="rc-table-status-pill ${(result.status || 'Pass') === 'Pass' ? 'pass' : 'fail'}">
                        ${(result.status || 'Pass').toUpperCase()}
                      </span>
                    </td>
                    <td class="rc-subj-remark-cell font-bold">${getGradeRemark(result.grade, result.percentage)}</td>
                  </tr>
                </tfoot>
              </table>
            `}
          </div>

          <!-- Bottom Section (Anchored to fill the A4 page) -->
          <div class="rc-bottom-block">
            <!-- 5. Side-by-Side Summary & Grading Criteria Container -->
            <div class="rc-bottom-container">
              <!-- Left: Summary Table -->
              <table class="rc-summary-table">
                <tbody>
                  <tr>
                    <td class="rc-sum-lbl">Total Marks:</td>
                    <td class="rc-sum-val"><strong>${combinedTotalObtained} / ${combinedTotalMax}</strong></td>
                  </tr>
                  <tr>
                    <td class="rc-sum-lbl">Percentage (%):</td>
                    <td class="rc-sum-val"><strong>${combinedPercentage}%</strong></td>
                  </tr>
                  <tr>
                    <td class="rc-sum-lbl">Overall Grade:</td>
                    <td class="rc-sum-val"><strong>${combinedGrade}</strong></td>
                  </tr>
                  <tr>
                    <td class="rc-sum-lbl">Class Position:</td>
                    <td class="rc-sum-val">
                      <span class="rc-position-pill">${positionDisplay}</span>
                    </td>
                  </tr>
                  <tr>
                    <td class="rc-sum-lbl">Result Status:</td>
                    <td class="rc-sum-val">
                      <span class="rc-table-status-pill ${(combinedStatus || 'Pass') === 'Pass' ? 'pass' : 'fail'}">
                        ${(combinedStatus || 'Pass').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Right: Institutional Grading Criteria Table -->
              <table class="rc-grading-table">
                <thead>
                  <tr>
                    <th>Grade</th>
                    <th>Percentage Range</th>
                    <th>Standard</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="text-center font-bold">A+</td>
                    <td class="text-center">80% – 100%</td>
                    <td class="text-center">Outstanding</td>
                  </tr>
                  <tr>
                    <td class="text-center font-bold">A</td>
                    <td class="text-center">70% – 79.9%</td>
                    <td class="text-center">Excellent</td>
                  </tr>
                  <tr>
                    <td class="text-center font-bold">B</td>
                    <td class="text-center">60% – 69.9%</td>
                    <td class="text-center">Very Good</td>
                  </tr>
                  <tr>
                    <td class="text-center font-bold">C</td>
                    <td class="text-center">50% – 59.9%</td>
                    <td class="text-center">Good</td>
                  </tr>
                  <tr>
                    <td class="text-center font-bold">D</td>
                    <td class="text-center">40% – 49.9%</td>
                    <td class="text-center">Satisfactory</td>
                  </tr>
                  <tr>
                    <td class="text-center font-bold">F</td>
                    <td class="text-center">Below 40%</td>
                    <td class="text-center">Needs Attention</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 6. Principal & Teacher Remarks Table -->
            <table class="rc-remarks-table">
              <thead>
                <tr>
                  <th>Principal &amp; Teacher Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>"${autoRemark}"</td>
                </tr>
              </tbody>
            </table>

            <!-- 7. 3-Column Signatures Row -->
            <div class="rc-footer-signatures">
              <div class="rc-sig-col">
                <div class="rc-sig-line"></div>
                <div class="rc-sig-title">Class Teacher</div>
              </div>
              <div class="rc-sig-col">
                <div class="rc-sig-line"></div>
                <div class="rc-sig-title">Controller of Examination</div>
              </div>
              <div class="rc-sig-col">
                ${settings.profile?.principalSignatureURL ? `
                  <img src="${settings.profile.principalSignatureURL}" class="rc-sig-img" alt="Signature">
                ` : ''}
                <div class="rc-sig-line"></div>
                <div class="rc-sig-title">Principal</div>
              </div>
            </div>

            <!-- 8. Footer Integrity Line -->
            <div class="rc-integrity-footer">
              © 2026 THE SPIRIT SCHOOL SAMUNDRI CAMPUS • OFFICIAL RESULT • PRINTED ON ${format(new Date(), 'dd MMMM yyyy').toUpperCase()}
            </div>
          </div>

        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en" dir="ltr">
    <head>
      <meta charset="UTF-8">
      <title>Result Cards - The Spirit School</title>
      <style>
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

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #eaedf2;
          color: var(--text);
          line-height: 1.4;
          padding: 24px 12px 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 100vh;
        }

        .report-card-wrapper {
          width: 100%;
          max-width: 840px;
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .page-break {
          page-break-after: always;
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

        .student-photo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
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

        .rc-sig-img {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          height: 48px;
          object-fit: contain;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          height: 38px;
          object-fit: contain;
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

          .rc-sig-img {
            bottom: 8mm !important;
            height: 12mm !important;
          }

          .rc-integrity-footer {
            font-size: 8.5pt !important;
            padding-top: 2mm !important;
          }
        }
      </style>
    </head>
    <body>
      ${pages}
    </body>
    </html>
  `;
}
