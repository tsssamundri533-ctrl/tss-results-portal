import fs from 'fs';
import path from 'path';

const SUPABASE_URL = "https://ajexxezafhfpyzsfyloa.supabase.co";
const SERVICE_KEY = "sb_secret_FBT0RksZZ39muHGdjLbVoQ_3J27hlzc";

const headers = {
  "apikey": SERVICE_KEY,
  "Authorization": `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "resolution=merge-duplicates",
  "User-Agent": "Node-PostgreSQL-Backend/1.0"
};

function parseTimestamp(ts) {
  if (!ts) return new Date().toISOString();
  if (typeof ts === 'string') {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) return d.toISOString();
    return new Date().toISOString();
  }
  if (typeof ts === 'number') {
    return new Date(ts).toISOString();
  }
  if (typeof ts === 'object') {
    if (ts.seconds) return new Date(ts.seconds * 1000).toISOString();
    if (ts._seconds) return new Date(ts._seconds * 1000).toISOString();
  }
  return new Date().toISOString();
}

async function insertBatch(table, records) {
  if (!records || records.length === 0) return;
  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers,
      body: JSON.stringify(batch)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to insert into ${table} [batch ${i}]: ${res.status} ${errText}`);
    }
  }
}

async function main() {
  const backupFile = path.resolve('backup/firebase_export.json');
  if (!fs.existsSync(backupFile)) {
    throw new Error("Backup file not found at " + backupFile);
  }
  const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

  console.log("🚀 Starting data migration into Supabase...\n");

  // 1. School Settings
  console.log("1. Migrating School Settings...");
  const schoolDoc = data.schoolDoc || {};
  const settingsCol = data.collections.settings || [];
  const profileSetting = settingsCol.find(s => s._id === 'profile') || {};
  const printConfigSetting = settingsCol.find(s => s._id === 'printConfig') || {};
  const remarksSetting = settingsCol.find(s => s._id === 'remarksMatrix') || {};

  const schoolRow = {
    id: schoolDoc._id || 'tss-main-school',
    school_name: schoolDoc.schoolName || profileSetting.schoolName || 'The Spirit School Samundri Campus',
    school_name_urdu: schoolDoc.schoolNameUrdu || profileSetting.schoolNameUrdu || '',
    logo_url: schoolDoc.logoURL || profileSetting.logoURL || null,
    favicon_url: profileSetting.faviconURL || null,
    principal_signature_url: profileSetting.principalSignatureURL || null,
    director_signature_url: profileSetting.directorSignatureURL || null,
    address: schoolDoc.address || profileSetting.address || 'Housing Colony #2 Samundri',
    phone: schoolDoc.phone || profileSetting.phone || '0333-9114333 | 0345-9114333',
    email: profileSetting.email || null,
    website: profileSetting.website || null,
    motto: profileSetting.motto || null,
    starting_roll_number: schoolDoc.startingRollNumber || 1001,
    grading_scale: schoolDoc.gradingScale || [],
    classes: schoolDoc.classes || [],
    class_sections: schoolDoc.classSections || {},
    print_config: printConfigSetting,
    result_card_remarks: remarksSetting,
    updated_at: parseTimestamp(schoolDoc.updatedAt)
  };
  await insertBatch('school_settings', [schoolRow]);
  console.log("   -> School Settings imported!");

  // 2. Exams / Terms
  console.log("2. Migrating Exams...");
  const exams = (data.collections.exams || []).map(e => ({
    id: e._id || e.id,
    title: e.title || 'Untitled Exam',
    exam_type_id: e.examTypeId || 'first-term',
    session_id: e.sessionId || 'session_1776658039868',
    year: e.year || 2026,
    classes: e.classes || [],
    class_configs: e.classConfigs || {},
    start_date: e.startDate || null,
    end_date: e.endDate || null,
    is_locked: e.isLocked ?? false,
    pass_percentage: e.passPercentage || 33,
    school_id: e.schoolId || 'tss-main-school',
    created_at: parseTimestamp(e.createdAt),
    updated_at: parseTimestamp(e.updatedAt)
  }));
  await insertBatch('exams', exams);
  console.log(`   -> ${exams.length} Exams imported!`);

  // 3. Students
  console.log("3. Migrating Students...");
  const students = (data.collections.students || []).map(s => ({
    id: s._id || s.id,
    roll_number: String(s.rollNumber || ''),
    name: s.name || '',
    father_name: s.fatherName || '',
    gender: s.gender || 'male',
    class_name: s.class || '',
    section_name: s.section || '',
    session_id: s.sessionId || 'default',
    corridor: s.corridor || '',
    photo_url: s.photoURL || null,
    qr_token: s.qrToken || '',
    status: s.status || 'active',
    school_id: s.schoolId || 'tss-main-school',
    created_at: parseTimestamp(s.createdAt),
    updated_at: parseTimestamp(s.updatedAt)
  }));
  await insertBatch('students', students);
  console.log(`   -> ${students.length} Students imported!`);

  // 4. Users / Staff
  console.log("4. Migrating Users / Staff...");
  const users = (data.collections.users || []).map(u => ({
    id: u._id || u.uid,
    email: u.email || `${u._id}@institution.local`,
    name: u.name || 'Staff Member',
    role: u.role || 'teacher',
    phone: u.phone || null,
    photo_url: u.photoURL || null,
    school_id: u.schoolId || 'tss-main-school',
    created_at: parseTimestamp(u.createdAt),
    updated_at: parseTimestamp(u.updatedAt)
  }));
  await insertBatch('users', users);
  console.log(`   -> ${users.length} Users imported!`);

  // 5. Assignments
  console.log("5. Migrating Assignments...");
  const assignments = (data.collections.assignments || []).map(a => ({
    id: a._id || a.id,
    teacher_id: a.teacherId || '',
    teacher_name: a.teacherName || '',
    class_name: a.className || '',
    section_name: a.sectionName || '',
    subject_id: a.subjectId || '',
    subject_name: a.subject || a.subjectName || '',
    session_id: a.sessionId || null,
    school_id: a.schoolId || 'tss-main-school',
    created_at: parseTimestamp(a.createdAt)
  }));
  await insertBatch('assignments', assignments);
  console.log(`   -> ${assignments.length} Assignments imported!`);

  // 6. Marks
  console.log("6. Migrating Marks (3,300+ records)...");
  const marksMap = new Map();
  for (const m of (data.collections.marks || [])) {
    const sId = m.studentId || '';
    const eId = m.examId || '';
    const subId = m.subjectId || '';
    if (!sId || !eId || !subId) continue;
    const key = `${sId}_${eId}_${subId}`;
    marksMap.set(key, {
      id: m._id || m.id || key,
      student_id: sId,
      student_name: m.studentName || '',
      exam_id: eId,
      subject_id: subId,
      class_name: m.classId || '',
      section_name: m.sectionName || '',
      marks: Number(m.marks || 0),
      max_marks: Number(m.maxMarks || 100),
      theory: m.theory ? Number(m.theory) : null,
      practical: m.practical ? Number(m.practical) : null,
      total: m.total ? Number(m.total) : Number(m.marks || 0),
      entered_by: m.enteredBy || '',
      school_id: m.schoolId || 'tss-main-school',
      updated_at: parseTimestamp(m.updatedAt)
    });
  }
  const marks = Array.from(marksMap.values());
  await insertBatch('marks', marks);
  console.log(`   -> ${marks.length} unique Marks imported!`);

  // 7. Results
  console.log("7. Migrating Results (380+ records)...");
  const resultsMap = new Map();
  for (const r of (data.collections.results || [])) {
    const sId = r.studentId || '';
    const eId = r.examId || '';
    if (!sId || !eId) continue;
    const key = `${sId}_${eId}`;
    resultsMap.set(key, {
      id: r._id || r.id || `${eId}_${sId}`,
      student_id: sId,
      exam_id: eId,
      school_id: r.schoolId || 'tss-main-school',
      student_name: r.studentName || '',
      roll_number: String(r.rollNumber || ''),
      class_name: r.className || '',
      section_name: r.sectionName || '',
      gender: r.gender || null,
      photo_url: r.photoURL || null,
      subjects: r.subjects || {},
      total_obtained: Number(r.totalObtained || 0),
      total_max: Number(r.totalMax || 0),
      percentage: Number(r.percentage || 0),
      grade: r.grade || '',
      status: r.status || 'Pass',
      remarks: r.remarks || '',
      computed_at: parseTimestamp(r.computedAt)
    });
  }
  const results = Array.from(resultsMap.values());
  await insertBatch('results', results);
  console.log(`   -> ${results.length} unique Results imported!`);

  // 8. Date Sheets
  console.log("8. Migrating Date Sheets...");
  const dateSheets = (data.collections.dateSheets || []).map(ds => ({
    id: ds._id || ds.id,
    exam_title: ds.examTitle || '',
    class_name: ds.className || '',
    papers: ds.papers || [],
    updated_at: parseTimestamp(ds.updatedAt)
  }));
  await insertBatch('date_sheets', dateSheets);
  console.log(`   -> ${dateSheets.length} Date Sheets imported!`);

  // 9. Seating Plans
  console.log("9. Migrating Seating Plans...");
  const seatingPlans = (data.collections.seatingPlans || []).map(sp => ({
    id: sp._id || sp.id,
    exam_id: sp.examId || '',
    exam_title: sp.examTitle || '',
    room_name: sp.roomName || '',
    corridor: sp.corridor || '',
    total_capacity: sp.totalCapacity || 0,
    columns: sp.columns || [],
    school_id: sp.schoolId || 'tss-main-school',
    created_at: parseTimestamp(sp.createdAt)
  }));
  await insertBatch('seating_plans', seatingPlans);
  console.log(`   -> ${seatingPlans.length} Seating Plans imported!`);

  console.log("\n=============================================");
  console.log("🎉 ALL DATA HAS BEEN SUCCESSFULLY MIGRATED TO SUPABASE!");
  console.log("=============================================");
}

main().catch(err => {
  console.error("\n❌ Migration Error:", err);
  process.exit(1);
});
