import { Attendance } from '@/types';
import { supabase } from './supabase';

const STORAGE_PREFIX = 'tss_attendance_';

/**
 * High-performance Attendance Service.
 * Combines 0ms Instant Local Cache with Supabase Cloud Sync.
 */
export async function getAttendanceRecords(examId: string, date: string): Promise<Attendance[]> {
  const localKey = `${STORAGE_PREFIX}${examId}_${date}`;
  let localRecords: Attendance[] = [];

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) localRecords = JSON.parse(raw) as Attendance[];
    } catch {
      // ignore
    }
  }

  // Also fetch latest from Supabase Cloud to ensure cross-device consistency
  try {
    const { data: exam } = await supabase
      .from('exams')
      .select('class_configs')
      .eq('id', examId)
      .maybeSingle();

    const cloudRecords: Attendance[] = exam?.class_configs?._attendance?.[date] || [];

    if (cloudRecords.length > 0) {
      // Merge cloud records with local records
      const map = new Map<string, Attendance>();
      localRecords.forEach(r => map.set(r.studentId, r));
      cloudRecords.forEach(r => map.set(r.studentId, r));
      const merged = Array.from(map.values());

      if (typeof window !== 'undefined') {
        localStorage.setItem(localKey, JSON.stringify(merged));
      }
      return merged;
    }
  } catch (err) {
    console.warn('Attendance cloud fetch warning:', err);
  }

  return localRecords;
}

export async function saveAttendanceRecord(examId: string, date: string, record: Attendance): Promise<boolean> {
  return saveAttendanceBatch(examId, date, [record]);
}

export async function saveAttendanceBatch(examId: string, date: string, records: Attendance[]): Promise<boolean> {
  const localKey = `${STORAGE_PREFIX}${examId}_${date}`;
  
  // 1. Instant Local Update (0ms)
  let current: Attendance[] = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) current = JSON.parse(raw) as Attendance[];
    } catch {
      // ignore
    }
  }

  const map = new Map<string, Attendance>();
  current.forEach(r => map.set(r.studentId, r));
  records.forEach(r => map.set(r.studentId, r));
  const updated = Array.from(map.values());

  if (typeof window !== 'undefined') {
    localStorage.setItem(localKey, JSON.stringify(updated));
  }

  // 2. Cloud Sync to Supabase
  try {
    const { data: exam } = await supabase
      .from('exams')
      .select('class_configs')
      .eq('id', examId)
      .maybeSingle();

    if (exam) {
      const configs = exam.class_configs || {};
      if (!configs._attendance) configs._attendance = {};
      
      const cloudCurrent: Attendance[] = configs._attendance[date] || [];
      const cloudMap = new Map<string, Attendance>();
      cloudCurrent.forEach(r => cloudMap.set(r.studentId, r));
      records.forEach(r => cloudMap.set(r.studentId, r));
      
      configs._attendance[date] = Array.from(cloudMap.values());

      await supabase
        .from('exams')
        .update({ class_configs: configs })
        .eq('id', examId);
    }
    return true;
  } catch (err) {
    console.error('Failed to sync attendance batch to Supabase:', err);
    return true; // Still true because local cache saved successfully
  }
}
