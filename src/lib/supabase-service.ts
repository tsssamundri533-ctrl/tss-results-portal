import { supabase } from './supabase';
import { Student, Exam, Mark, Result, SchoolSettings, Assignment, UserProfile, UserRole, SeatingPlan, DateSheet, Session } from '@/types';

// ============================================================================
// 1. School Settings
// ============================================================================
export async function getSchoolSettings(): Promise<SchoolSettings | null> {
  const { data, error } = await supabase
    .from('school_settings')
    .select('*')
    .eq('id', 'tss-main-school')
    .maybeSingle();

  if (error || !data) {
    console.error('Error fetching school settings from Supabase:', error);
    return null;
  }

  let activeSession: Session = {
    id: 'session_2026',
    title: '2026',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    isActive: true,
    classes: data.classes || [],
    createdAt: null
  };

  try {
    const { data: sessionData } = await supabase
      .from('academic_sessions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionData) {
      activeSession = {
        id: sessionData.id,
        title: sessionData.title,
        startDate: sessionData.start_date,
        endDate: sessionData.end_date,
        isActive: sessionData.is_active,
        classes: sessionData.classes || data.classes || [],
        createdAt: sessionData.created_at
      };
    }
  } catch (err) {
    console.warn('Could not fetch active session from academic_sessions, using default:', err);
  }

  return {
    id: data.id,
    classes: data.classes || [],
    sections: data.sections || [],
    classSections: data.class_sections || {},
    gradingScale: data.grading_scale || [],
    activeSession,
    printConfig: data.print_config || null,
    remarksConfig: data.result_card_remarks || null,
    profile: {
      schoolName: data.school_name,
      schoolNameUrdu: data.school_name_urdu,
      logoURL: data.logo_url,
      faviconURL: data.favicon_url,
      principalSignatureURL: data.principal_signature_url,
      directorSignatureURL: data.director_signature_url,
      address: data.address,
      city: data.city,
      province: data.province,
      country: data.country,
      phone: data.phone,
      phone2: data.phone2,
      email: data.email,
      website: data.website,
      motto: data.motto,
      startingRollNumber: data.starting_roll_number,
      rollNumberSlipInstructions: data.roll_number_slip_instructions,
      resultCardRemarks: data.result_card_remarks,
      updatedAt: data.updated_at
    },
    subjects: data.subjects || []
  };
}

export async function updateSchoolSettings(updates: Record<string, any>): Promise<boolean> {
  const payload: any = {
    updated_at: new Date().toISOString()
  };
  if (updates.classes !== undefined) payload.classes = updates.classes;
  if (updates.sections !== undefined) payload.sections = updates.sections;
  if (updates.classSections !== undefined) payload.class_sections = updates.classSections;
  if (updates.gradingScale !== undefined) payload.grading_scale = updates.gradingScale;
  if (updates.subjects !== undefined) payload.subjects = updates.subjects;
  if (updates.printConfig !== undefined) payload.print_config = updates.printConfig;
  if (updates.remarksConfig !== undefined) payload.result_card_remarks = updates.remarksConfig;
  if (updates.resultCardRemarks !== undefined) payload.result_card_remarks = updates.resultCardRemarks;

  if (updates.profile) {
    const p = updates.profile;
    if (p.schoolName !== undefined) payload.school_name = p.schoolName;
    if (p.schoolNameUrdu !== undefined) payload.school_name_urdu = p.schoolNameUrdu;
    if (p.logoURL !== undefined) payload.logo_url = p.logoURL;
    if (p.faviconURL !== undefined) payload.favicon_url = p.faviconURL;
    if (p.principalSignatureURL !== undefined) payload.principal_signature_url = p.principalSignatureURL;
    if (p.directorSignatureURL !== undefined) payload.director_signature_url = p.directorSignatureURL;
    if (p.address !== undefined) payload.address = p.address;
    if (p.city !== undefined) payload.city = p.city;
    if (p.province !== undefined) payload.province = p.province;
    if (p.country !== undefined) payload.country = p.country;
    if (p.phone !== undefined) payload.phone = p.phone;
    if (p.phone2 !== undefined) payload.phone2 = p.phone2;
    if (p.email !== undefined) payload.email = p.email;
    if (p.website !== undefined) payload.website = p.website;
    if (p.motto !== undefined) payload.motto = p.motto;
    if (p.startingRollNumber !== undefined) payload.starting_roll_number = p.startingRollNumber;
    if (p.rollNumberSlipInstructions !== undefined) payload.roll_number_slip_instructions = p.rollNumberSlipInstructions;
  }
  if (updates.schoolName !== undefined) payload.school_name = updates.schoolName;
  if (updates.schoolNameUrdu !== undefined) payload.school_name_urdu = updates.schoolNameUrdu;
  if (updates.address !== undefined) payload.address = updates.address;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.startingRollNumber !== undefined) payload.starting_roll_number = updates.startingRollNumber;

  const { error } = await supabase
    .from('school_settings')
    .update(payload)
    .eq('id', 'tss-main-school');

  if (error) {
    console.error('Error updating school settings in Supabase:', error);
    return false;
  }
  return true;
}



// ============================================================================
// 2. Exams & Terms
// ============================================================================
export async function getExams(): Promise<Exam[]> {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((e) => ({
    id: e.id,
    title: e.title,
    examTypeId: e.exam_type_id,
    sessionId: e.session_id,
    year: e.year,
    classes: e.classes || [],
    classConfigs: e.class_configs || {},
    startDate: e.start_date,
    endDate: e.end_date,
    isLocked: e.is_locked,
    passPercentage: Number(e.pass_percentage || 33),
    schoolId: e.school_id,
    createdAt: e.created_at
  }));
}

export async function getExamById(id: string): Promise<Exam | null> {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    examTypeId: data.exam_type_id,
    sessionId: data.session_id,
    year: data.year,
    classes: data.classes || [],
    classConfigs: data.class_configs || {},
    startDate: data.start_date,
    endDate: data.end_date,
    isLocked: data.is_locked,
    passPercentage: Number(data.pass_percentage || 33),
    schoolId: data.school_id,
    createdAt: data.created_at
  };
}



export async function updateExamClassConfigs(examId: string, classConfigs: any): Promise<boolean> {
  const { error } = await supabase
    .from('exams')
    .update({ class_configs: classConfigs, updated_at: new Date().toISOString() })
    .eq('id', examId);

  if (error) {
    console.error('Error updating exam class configs in Supabase:', error);
    return false;
  }
  return true;
}

export async function createExam(exam: Partial<Exam>): Promise<Exam | null> {
  const payload = {
    id: exam.id || `exam_${Date.now()}`,
    title: exam.title || 'Final Term 2026',
    exam_type_id: exam.examTypeId || 'final-term',
    session_id: exam.sessionId || 'session_2026',
    year: exam.year || 2026,
    classes: exam.classes || [],
    class_configs: exam.classConfigs || {},
    start_date: exam.startDate || null,
    end_date: exam.endDate || null,
    is_locked: !!exam.isLocked,
    pass_percentage: exam.passPercentage || 33,
    school_id: exam.schoolId || 'tss-main-school',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('exams')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Error creating exam in Supabase:', error);
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    examTypeId: data.exam_type_id,
    sessionId: data.session_id,
    year: data.year,
    classes: data.classes || [],
    classConfigs: data.class_configs || {},
    startDate: data.start_date,
    endDate: data.end_date,
    isLocked: data.is_locked,
    passPercentage: Number(data.pass_percentage || 33),
    schoolId: data.school_id,
    createdAt: data.created_at
  };
}



export async function updateExam(examId: string, updates: Partial<Exam>): Promise<boolean> {
  const payload: any = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.examTypeId !== undefined) payload.exam_type_id = updates.examTypeId;
  if (updates.classes !== undefined) payload.classes = updates.classes;
  if (updates.classConfigs !== undefined) payload.class_configs = updates.classConfigs;
  if (updates.startDate !== undefined) payload.start_date = updates.startDate;
  if (updates.endDate !== undefined) payload.end_date = updates.endDate;
  if (updates.isLocked !== undefined) payload.is_locked = updates.isLocked;
  if (updates.passPercentage !== undefined) payload.pass_percentage = updates.passPercentage;

  const { error } = await supabase
    .from('exams')
    .update(payload)
    .eq('id', examId);

  if (error) {
    console.error('Error updating exam in Supabase:', error);
    return false;
  }
  return true;
}

export async function deleteExam(examId: string): Promise<boolean> {
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', examId);

  if (error) {
    console.error('Error deleting exam from Supabase:', error);
    return false;
  }
  return true;
}

export async function toggleExamLock(examId: string, isLocked: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('exams')
    .update({ is_locked: isLocked, updated_at: new Date().toISOString() })
    .eq('id', examId);

  if (error) {
    console.error('Error toggling exam lock in Supabase:', error);
    return false;
  }
  return true;
}

export interface ClassExamSummary {
  className: string;
  totalStudents: number;
  totalSubjects: number;
  subjectNames: string[];
  marksCount: number;
  expectedMarksCount: number;
  resultsCount: number;
  isFullyCompiled: boolean;
  completionPercentage: number;
}

export async function getExamSummary(examId: string, classes: string[], classConfigs: Record<string, any>): Promise<ClassExamSummary[]> {
  const summaries: ClassExamSummary[] = [];

  const [studentsRes, marksRes, resultsRes] = await Promise.all([
    supabase.from('students').select('class_name').eq('status', 'active'),
    supabase.from('marks').select('class_name, subject_id').eq('exam_id', examId),
    supabase.from('results').select('class_name').eq('exam_id', examId)
  ]);

  const studentsByClass: Record<string, number> = {};
  (studentsRes.data || []).forEach((s: any) => {
    studentsByClass[s.class_name] = (studentsByClass[s.class_name] || 0) + 1;
  });

  const marksByClass: Record<string, number> = {};
  (marksRes.data || []).forEach((m: any) => {
    marksByClass[m.class_name] = (marksByClass[m.class_name] || 0) + 1;
  });

  const resultsByClass: Record<string, number> = {};
  (resultsRes.data || []).forEach((r: any) => {
    resultsByClass[r.class_name] = (resultsByClass[r.class_name] || 0) + 1;
  });

  for (const cls of classes) {
    const subjectsMap = classConfigs?.[cls]?.subjects || {};
    const totalSubjects = Object.keys(subjectsMap).length;
    const subjectNames = Object.values(subjectsMap).map((s: any) => s.name);
    const totalStudents = studentsByClass[cls] || 0;
    const expectedMarks = totalStudents * totalSubjects;
    const marksCount = marksByClass[cls] || 0;
    const resultsCount = resultsByClass[cls] || 0;

    const completionPercentage = expectedMarks > 0 
      ? Math.min(100, Math.round((marksCount / expectedMarks) * 100)) 
      : (totalStudents > 0 && totalSubjects === 0 ? 0 : 100);

    const isFullyCompiled = totalStudents > 0 && resultsCount >= totalStudents;

    summaries.push({
      className: cls,
      totalStudents,
      totalSubjects,
      subjectNames,
      marksCount,
      expectedMarksCount: expectedMarks,
      resultsCount,
      isFullyCompiled,
      completionPercentage
    });
  }

  return summaries;
}

// ============================================================================
// 3. Students
// ============================================================================
export async function getStudents(className?: string, sectionName?: string): Promise<Student[]> {
  let query = supabase
    .from('students')
    .select('*')
    .eq('status', 'active');

  if (className) query = query.eq('class_name', className);
  if (sectionName) query = query.eq('section_name', sectionName);

  query = query.order('roll_number', { ascending: true });

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((s) => ({
    id: s.id,
    rollNumber: s.roll_number,
    name: s.name,
    fatherName: s.father_name,
    gender: s.gender as 'male' | 'female',
    class: s.class_name,
    section: s.section_name,
    sessionId: s.session_id,
    corridor: s.corridor as any,
    photoURL: s.photo_url,
    qrToken: s.qr_token,
    status: s.status as any,
    schoolId: s.school_id,
    createdAt: s.created_at
  }));
}

export async function getStudentById(studentId: string): Promise<Student | null> {
  let { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .maybeSingle();

  // Resilient fallback: find by partial ID suffix or roll number
  if (!data) {
    const { data: fallbackData } = await supabase
      .from('students')
      .select('*')
      .or(`id.ilike.%${studentId}%,roll_number.eq.${studentId}`)
      .limit(1)
      .maybeSingle();
    data = fallbackData;
  }

  if (!data) return null;

  return {
    id: data.id,
    rollNumber: data.roll_number,
    name: data.name,
    fatherName: data.father_name,
    gender: data.gender as 'male' | 'female',
    class: data.class_name,
    section: data.section_name,
    sessionId: data.session_id,
    corridor: data.corridor as any,
    photoURL: data.photo_url,
    qrToken: data.qr_token,
    status: data.status as any,
    schoolId: data.school_id,
    createdAt: data.created_at
  };
}

export async function checkDuplicateRollNumber(rollNumber: string, excludeStudentId?: string): Promise<{ isDuplicate: boolean; studentName?: string; studentClass?: string; studentSection?: string }> {
  const cleanRoll = rollNumber.trim();
  if (!cleanRoll) return { isDuplicate: false };

  let query = supabase
    .from('students')
    .select('id, name, class_name, section_name, roll_number')
    .eq('roll_number', cleanRoll)
    .eq('status', 'active');

  if (excludeStudentId) {
    query = query.neq('id', excludeStudentId);
  }

  const { data, error } = await query.limit(1).maybeSingle();
  if (data) {
    return {
      isDuplicate: true,
      studentName: data.name,
      studentClass: data.class_name,
      studentSection: data.section_name
    };
  }
  return { isDuplicate: false };
}

export async function upsertStudent(student: Partial<Student> & { id: string }): Promise<boolean> {
  const record: any = {
    id: student.id,
    name: student.name || '',
    father_name: student.fatherName || '',
    gender: student.gender || 'male',
    roll_number: student.rollNumber ? String(student.rollNumber) : '',
    class_name: student.class || '',
    section_name: student.section || '',
    corridor: student.corridor || 'Corridor A',
    photo_url: student.photoURL || null,
    qr_token: student.qrToken || Math.random().toString(36).substring(2, 15),
    status: student.status || 'active',
    session_id: student.sessionId || 'default',
    school_id: student.schoolId || 'tss-main-school',
  };

  const { error } = await supabase.from('students').upsert(record, { onConflict: 'id' });
  if (error) {
    console.error('upsertStudent error in Supabase:', error);
    return false;
  }
  return true;
}

export async function deleteStudent(studentId: string): Promise<boolean> {
  const { error } = await supabase.from('students').update({ status: 'archived' }).eq('id', studentId);
  if (error) {
    console.error('deleteStudent error in Supabase:', error);
    return false;
  }
  return true;
}



// ============================================================================
// 4. Marks
// ============================================================================
export async function getMarks(
  examId: string,
  className?: string,
  sectionName?: string,
  subjectId?: string
): Promise<Mark[]> {
  let query = supabase.from('marks').select('*').eq('exam_id', examId);

  if (className) query = query.eq('class_name', className);
  if (sectionName) query = query.eq('section_name', sectionName);
  if (subjectId) query = query.eq('subject_id', subjectId);

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((m) => ({
    id: m.id,
    studentId: m.student_id,
    studentName: m.student_name,
    examId: m.exam_id,
    subjectId: m.subject_id,
    classId: m.class_name,
    sectionName: m.section_name,
    marks: Number(m.marks),
    maxMarks: Number(m.max_marks),
    theory: m.theory ? Number(m.theory) : undefined,
    practical: m.practical ? Number(m.practical) : undefined,
    total: m.total ? Number(m.total) : Number(m.marks),
    enteredBy: m.entered_by,
    schoolId: m.school_id,
    updatedAt: m.updated_at
  }));
}

export async function saveMarksBatch(marks: Partial<Mark>[]): Promise<boolean> {
  if (!marks || marks.length === 0) return true;

  const records = marks.map((m) => {
    const key = `${m.studentId}_${m.examId}_${m.subjectId}`;
    return {
      id: m.id || key,
      student_id: m.studentId,
      student_name: m.studentName || '',
      exam_id: m.examId,
      subject_id: m.subjectId,
      class_name: m.classId || '',
      section_name: m.sectionName || '',
      marks: Number(m.marks ?? 0),
      max_marks: Number(m.maxMarks ?? 100),
      theory: m.theory !== undefined ? Number(m.theory) : null,
      practical: m.practical !== undefined ? Number(m.practical) : null,
      total: m.total !== undefined ? Number(m.total) : Number(m.marks ?? 0),
      entered_by: m.enteredBy || 'Admin',
      school_id: 'tss-main-school',
      updated_at: new Date().toISOString()
    };
  });

  const { error } = await supabase.from('marks').upsert(records, {
    onConflict: 'student_id,exam_id,subject_id'
  });

  if (error) {
    console.error('Error batch saving marks to Supabase:', error);
    return false;
  }
  return true;
}

// ============================================================================
// 5. Results & Multi-Term Reports
// ============================================================================
export async function getResultByStudent(examId: string, studentId: string): Promise<Result | null> {
  const { data, error } = await supabase
    .from('results')
    .select('*')
    .eq('exam_id', examId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    studentId: data.student_id,
    examId: data.exam_id,
    schoolId: data.school_id,
    studentName: data.student_name,
    rollNumber: data.roll_number,
    className: data.class_name,
    sectionName: data.section_name,
    gender: data.gender,
    photoURL: data.photo_url,
    subjects: data.subjects || {},
    totalObtained: Number(data.total_obtained),
    totalMax: Number(data.total_max),
    percentage: Number(data.percentage),
    grade: data.grade,
    status: data.status,
    remarks: data.remarks,
    computedAt: data.computed_at
  };
}



export async function getResults(examId?: string, className?: string, sectionName?: string): Promise<Result[]> {
  let query = supabase.from('results').select('*');
  if (examId) query = query.eq('exam_id', examId);
  if (className) query = query.eq('class_name', className);
  if (sectionName) query = query.eq('section_name', sectionName);

  query = query.order('percentage', { ascending: false });

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((r) => ({
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

export async function saveResultsBatch(results: Result[]): Promise<boolean> {
  if (!results || results.length === 0) return true;

  const records = results.map((r) => ({
    id: r.id || `${r.examId}_${r.studentId}`,
    student_id: r.studentId,
    exam_id: r.examId,
    school_id: r.schoolId || 'tss-main-school',
    student_name: r.studentName,
    roll_number: r.rollNumber,
    class_name: r.className,
    section_name: r.sectionName,
    gender: r.gender || null,
    photo_url: r.photoURL || null,
    subjects: r.subjects,
    total_obtained: r.totalObtained,
    total_max: r.totalMax,
    percentage: r.percentage,
    grade: r.grade,
    status: r.status,
    remarks: r.remarks,
    computed_at: new Date().toISOString()
  }));

  const { error } = await supabase.from('results').upsert(records, {
    onConflict: 'student_id,exam_id'
  });

  if (error) {
    console.error('Error batch saving results to Supabase:', error);
    return false;
  }
  return true;
}

// Multi-term consolidated report for a student
export interface MultiTermSubjectComparison {
  name: string;
  term1Marks?: number;
  term1Max?: number;
  term1Grade?: string;
  term2Marks?: number;
  term2Max?: number;
  term2Grade?: string;
  totalMarks: number;
  totalMax: number;
  grade: string;
}

export interface MultiTermStudentReport {
  student: Student;
  term1Result: Result | null;
  term2Result: Result | null;
  subjects: Record<string, MultiTermSubjectComparison>;
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  status: 'Pass' | 'Fail';
}

export async function getMultiTermReport(studentId: string, primaryExamId?: string, secondaryExamId?: string): Promise<MultiTermStudentReport | null> {
  const student = await getStudentById(studentId);
  if (!student) return null;

  let e1Id = secondaryExamId;
  let e2Id = primaryExamId;

  if (!e1Id || !e2Id) {
    const list = await getExams();
    if (!e2Id && list.length > 0) e2Id = list[0].id;
    if (!e1Id && list.length > 1) e1Id = list[1].id;
  }

  const [t1Result, t2Result] = await Promise.all([
    e1Id ? getResultByStudent(e1Id, studentId) : null,
    e2Id ? getResultByStudent(e2Id, studentId) : null
  ]);

  const subjectMap: Record<string, MultiTermSubjectComparison> = {};

  // Process First Term
  if (t1Result && t1Result.subjects) {
    for (const [subId, sub] of Object.entries(t1Result.subjects)) {
      subjectMap[subId] = {
        name: sub.name,
        term1Marks: sub.marks,
        term1Max: sub.maxMarks,
        term1Grade: sub.grade,
        totalMarks: sub.marks,
        totalMax: sub.maxMarks,
        grade: sub.grade
      };
    }
  }

  // Process Second Term
  if (t2Result && t2Result.subjects) {
    for (const [subId, sub] of Object.entries(t2Result.subjects)) {
      if (!subjectMap[subId]) {
        subjectMap[subId] = {
          name: sub.name,
          term2Marks: sub.marks,
          term2Max: sub.maxMarks,
          term2Grade: sub.grade,
          totalMarks: sub.marks,
          totalMax: sub.maxMarks,
          grade: sub.grade
        };
      } else {
        subjectMap[subId].term2Marks = sub.marks;
        subjectMap[subId].term2Max = sub.maxMarks;
        subjectMap[subId].term2Grade = sub.grade;
        subjectMap[subId].totalMarks = (subjectMap[subId].term1Marks || 0) + sub.marks;
        subjectMap[subId].totalMax = (subjectMap[subId].term1Max || 0) + sub.maxMarks;
        const pct = subjectMap[subId].totalMax > 0 ? (subjectMap[subId].totalMarks / subjectMap[subId].totalMax) * 100 : 0;
        subjectMap[subId].grade = pct >= 80 ? 'A+' : pct >= 70 ? 'A' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 33 ? 'D' : 'F';
      }
    }
  }

  let totalObtained = 0;
  let totalMax = 0;
  for (const s of Object.values(subjectMap)) {
    totalObtained += s.totalMarks;
    totalMax += s.totalMax;
  }
  const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;
  const grade = percentage >= 80 ? 'A+' : percentage >= 70 ? 'A' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : percentage >= 33 ? 'D' : 'F';
  const status = percentage >= 33 ? 'Pass' : 'Fail';

  return {
    student,
    term1Result: t1Result,
    term2Result: t2Result,
    subjects: subjectMap,
    totalObtained,
    totalMax,
    percentage,
    grade,
    status
  };
}



// ============================================================================
// 6. Fast Dashboard Statistics
// ============================================================================
export interface DashboardStats {
  totalStudents: number;
  totalMarks: number;
  totalResults: number;
  exams: Exam[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [stRes, mRes, resRes, exams] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('marks').select('*', { count: 'exact', head: true }),
    supabase.from('results').select('*', { count: 'exact', head: true }),
    getExams()
  ]);

  return {
    totalStudents: stRes.count || 0,
    totalMarks: mRes.count || 0,
    totalResults: resRes.count || 0,
    exams
  };
}

// ============================================================================
// Staff & Assignments (Teachers Directory - 100% Supabase)
// ============================================================================
export async function getStaff(role?: string): Promise<UserProfile[]> {
  let query = supabase.from('users').select('*');
  if (role) {
    query = query.eq('role', role);
  }
  const { data, error } = await query;
  if (error || !data) {
    console.error('Error fetching staff from Supabase:', error);
    return [];
  }
  return data.map(u => ({
    uid: u.id,
    email: u.email,
    name: u.name,
    role: u.role as UserRole,
    phone: u.phone,
    photoURL: u.photo_url,
    schoolId: u.school_id || 'tss-main-school',
    createdAt: u.created_at
  }));
}

export async function upsertStaff(profile: Partial<UserProfile> & { uid: string }): Promise<boolean> {
  const payload: any = {
    id: profile.uid,
    name: profile.name || '',
    email: profile.email || '',
    role: profile.role || 'teacher',
    phone: profile.phone || null,
    photo_url: profile.photoURL || null,
    school_id: profile.schoolId || 'tss-main-school',
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
  if (error) {
    console.error('upsertStaff error in Supabase:', error);
    return false;
  }
  return true;
}

export async function deleteStaff(uid: string): Promise<boolean> {
  const { error } = await supabase.from('users').delete().eq('id', uid);
  if (error) {
    console.error('deleteStaff error in Supabase:', error);
    return false;
  }
  return true;
}

export async function getStaffAssignments(teacherId?: string): Promise<Assignment[]> {
  let query = supabase.from('assignments').select('*');
  if (teacherId) {
    query = query.eq('teacher_id', teacherId);
  }
  const { data, error } = await query;
  if (error || !data) {
    console.error('Error fetching assignments from Supabase:', error);
    return [];
  }
  return data.map(a => ({
    id: a.id,
    teacherId: a.teacher_id,
    teacherName: a.teacher_name,
    className: a.class_name,
    sectionName: a.section_name || 'All',
    subject: a.subject_name || '',
    subjectName: a.subject_name || '',
    subjectId: a.subject_id,
    sessionId: a.session_id || 'default',
    createdAt: a.created_at
  }));
}

export async function upsertStaffAssignment(assignment: Partial<Assignment> & { id: string }): Promise<boolean> {
  const payload: any = {
    id: assignment.id,
    teacher_id: assignment.teacherId,
    teacher_name: assignment.teacherName,
    class_name: assignment.className,
    section_name: assignment.sectionName || 'All',
    subject_id: assignment.subjectId,
    subject_name: assignment.subject || assignment.subjectName || '',
    session_id: assignment.sessionId || 'default',
    school_id: 'tss-main-school',
    created_at: new Date().toISOString()
  };
  const { error } = await supabase.from('assignments').upsert(payload, { onConflict: 'id' });
  if (error) {
    console.error('upsertStaffAssignment error in Supabase:', error);
    return false;
  }
  return true;
}

export async function deleteStaffAssignment(id: string): Promise<boolean> {
  const { error } = await supabase.from('assignments').delete().eq('id', id);
  if (error) {
    console.error('deleteStaffAssignment error in Supabase:', error);
    return false;
  }
  return true;
}

// ============================================================================
// 9. Seating Plans
// ============================================================================
export async function getSeatingPlans(examId?: string): Promise<SeatingPlan[]> {
  let query = supabase.from('seating_plans').select('*').order('created_at', { ascending: false });
  if (examId) query = query.eq('exam_id', examId);
  const { data, error } = await query;
  if (error || !data) {
    console.error('Error fetching seating plans:', error);
    return [];
  }
  return data.map((sp) => ({
    id: sp.id,
    examId: sp.exam_id,
    examTitle: sp.exam_title,
    roomName: sp.room_name,
    corridor: sp.corridor,
    totalCapacity: sp.total_capacity,
    columns: sp.columns || [],
    schoolId: sp.school_id || 'tss-main-school',
    createdAt: sp.created_at,
    createdBy: sp.created_by || 'Admin',
  }));
}

export async function getSeatingPlanById(id: string): Promise<SeatingPlan | null> {
  const { data, error } = await supabase.from('seating_plans').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    examId: data.exam_id,
    examTitle: data.exam_title,
    roomName: data.room_name,
    corridor: data.corridor,
    totalCapacity: data.total_capacity,
    columns: data.columns || [],
    schoolId: data.school_id || 'tss-main-school',
    createdAt: data.created_at,
    createdBy: data.created_by || 'Admin',
  };
}

export async function upsertSeatingPlan(plan: Partial<SeatingPlan> & { id: string }): Promise<boolean> {
  const payload: any = {
    id: plan.id,
    exam_id: plan.examId,
    exam_title: plan.examTitle,
    room_name: plan.roomName,
    corridor: plan.corridor || '',
    total_capacity: plan.totalCapacity || 0,
    columns: plan.columns || [],
    school_id: plan.schoolId || 'tss-main-school',
    created_at: (plan as any).createdAt || new Date().toISOString()
  };
  const { error } = await supabase.from('seating_plans').upsert(payload, { onConflict: 'id' });
  if (error) {
    console.error('upsertSeatingPlan error in Supabase:', error);
    return false;
  }
  return true;
}

export async function deleteSeatingPlan(id: string): Promise<boolean> {
  const { error } = await supabase.from('seating_plans').delete().eq('id', id);
  if (error) {
    console.error('deleteSeatingPlan error in Supabase:', error);
    return false;
  }
  return true;
}

// ============================================================================
// 10. Date Sheets
// ============================================================================
export async function getDateSheets(examTitle?: string): Promise<DateSheet[]> {
  let query = supabase.from('date_sheets').select('*').order('updated_at', { ascending: false });
  if (examTitle) query = query.eq('exam_title', examTitle);
  const { data, error } = await query;
  if (error || !data) {
    console.error('Error fetching date sheets:', error);
    return [];
  }
  return data.map((ds) => ({
    id: ds.id,
    examTitle: ds.exam_title,
    className: ds.class_name,
    papers: ds.papers || [],
    updatedAt: ds.updated_at
  }));
}

export async function upsertDateSheet(sheet: Partial<DateSheet> & { id: string }): Promise<boolean> {
  const payload: any = {
    id: sheet.id,
    exam_title: sheet.examTitle,
    class_name: sheet.className,
    papers: sheet.papers || [],
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from('date_sheets').upsert(payload, { onConflict: 'id' });
  if (error) {
    console.error('upsertDateSheet error in Supabase:', error);
    return false;
  }
  return true;
}

export async function deleteDateSheet(id: string): Promise<boolean> {
  const { error } = await supabase.from('date_sheets').delete().eq('id', id);
  if (error) {
    console.error('deleteDateSheet error in Supabase:', error);
    return false;
  }
  return true;
}

// ============================================================================
// 11. Academic Sessions
// ============================================================================
export async function getAcademicSessions(): Promise<Session[]> {
  const { data, error } = await supabase.from('academic_sessions').select('*').order('created_at', { ascending: false });
  if (error || !data) {
    console.error('Error fetching academic sessions:', error);
    return [];
  }
  return data.map((s) => ({
    id: s.id,
    title: s.title,
    startDate: s.start_date,
    endDate: s.end_date,
    isActive: s.is_active,
    classes: s.classes || [],
    createdAt: s.created_at
  }));
}

export async function upsertAcademicSession(session: Partial<Session> & { id: string }): Promise<boolean> {
  const payload: any = {
    id: session.id,
    title: session.title,
    start_date: session.startDate,
    end_date: session.endDate,
    is_active: session.isActive ?? false,
    classes: session.classes || [],
    created_at: (session as any).createdAt || new Date().toISOString()
  };
  const { error } = await supabase.from('academic_sessions').upsert(payload, { onConflict: 'id' });
  if (error) {
    console.error('upsertAcademicSession error in Supabase:', error);
    return false;
  }
  return true;
}

export async function deleteAcademicSession(id: string): Promise<boolean> {
  const { error } = await supabase.from('academic_sessions').delete().eq('id', id);
  if (error) {
    console.error('deleteAcademicSession error in Supabase:', error);
    return false;
  }
  return true;
}

export async function setActiveAcademicSession(id: string): Promise<boolean> {
  // Set all to false, then set target to true
  await supabase.from('academic_sessions').update({ is_active: false }).neq('id', '___nonexistent___');
  const { error } = await supabase.from('academic_sessions').update({ is_active: true }).eq('id', id);
  if (error) {
    console.error('setActiveAcademicSession error in Supabase:', error);
    return false;
  }
  return true;
}



