'use server';

import { getServiceSupabase } from '@/lib/supabase';
import { upsertStaff, upsertStaffAssignment } from '@/lib/supabase-service';

export interface CreateTeacherInput {
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  password?: string;
  selectedClasses: string[];
  selectedSubjects: string[];
  availableSubjects: { id: string; name: string }[];
  sessionId?: string;
}

/**
 * Server Action: Provision Teacher Identity & Workload directly in Supabase.
 */
export async function createTeacherAccount(data: CreateTeacherInput) {
  try {
    const serviceSupabase = getServiceSupabase();
    const email = data.email.trim().toLowerCase();
    const password = data.password?.trim() || 'spirit533';

    // 1. Provision user in Supabase Auth
    let uid: string;
    const { data: authUser, error: authError } = await serviceSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: data.name,
        role: 'teacher',
        phone: data.phone,
        photoURL: data.photoURL
      }
    });

    if (authError) {
      // If user already exists in auth, find existing ID
      if (authError.message.includes('already been registered') || (authError as any).status === 422) {
        const { data: list } = await serviceSupabase.auth.admin.listUsers();
        const existing = list.users.find(u => u.email?.toLowerCase() === email);
        if (existing) {
          uid = existing.id;
          await serviceSupabase.auth.admin.updateUserById(uid, {
            password,
            user_metadata: { name: data.name, role: 'teacher' }
          });
        } else {
          uid = `teacher_${Date.now()}`;
        }
      } else {
        throw new Error(authError.message);
      }
    } else {
      uid = authUser.user.id;
    }

    // 2. Persist in public.users table in Supabase
    await upsertStaff({
      uid,
      name: data.name,
      email,
      phone: data.phone,
      photoURL: data.photoURL,
      role: 'teacher',
      schoolId: 'tss-main-school'
    });

    // 3. Persist Class & Subject Assignments in Supabase
    for (const subId of data.selectedSubjects) {
      const subjectMeta = data.availableSubjects.find(s => s.id === subId);
      for (const className of data.selectedClasses) {
        const assignmentId = `${uid}_${className}_${subId}`.replace(/\s+/g, '_');
        await upsertStaffAssignment({
          id: assignmentId,
          teacherId: uid,
          teacherName: data.name,
          className: className,
          sectionName: 'All',
          subject: subjectMeta?.name || 'Subject',
          subjectName: subjectMeta?.name || 'Subject',
          subjectId: subId,
          sessionId: data.sessionId || 'default',
          createdAt: new Date().toISOString()
        });
      }
    }

    return { success: true, uid };
  } catch (error: any) {
    console.error("createTeacherAccount error:", error);
    return { success: false, error: error.message || 'Failed to authorize teacher' };
  }
}
