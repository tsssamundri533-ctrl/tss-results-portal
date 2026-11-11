'use client';

import { use, useState, useEffect, useMemo, useRef } from 'react';
import { 
  User, 
  ChevronLeft, 
  Mail, 
  Phone, 
  Loader2, 
  Save, 
  ShieldCheck, 
  BookOpen, 
  GraduationCap, 
  CheckCircle2, 
  Check, 
  Camera, 
  ImageIcon 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { upsertStaff, getStaffAssignments, upsertStaffAssignment, deleteStaffAssignment } from '@/lib/supabase-service';
import { useAuthStore, FIXED_SCHOOL_ID } from '@/store/use-auth-store';
import { useSchoolStore } from '@/store/use-school-store';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserProfile, Assignment } from '@/types';
import imageCompression from 'browser-image-compression';
import { uploadToCloudinary } from '@/app/actions/cloudinary-upload';
import { cn } from '@/lib/utils';
import { useSchoolSettings } from '@/hooks/use-school-settings';

export default function EditTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const router = useRouter();
  
  const schoolId = useAuthStore(state => state.schoolId);
  const settings = useSchoolStore(state => state.settings);
  useSchoolSettings();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isInitialized = useRef(false);

  const [teacher, setTeacher] = useState<UserProfile | null>(null);
  const [currentAssignments, setCurrentAssignments] = useState<Assignment[]>([]);
  const [teacherLoading, setTeacherLoading] = useState(true);

  // Load staff profile and assignments from Supabase
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [teacherRes, assignData] = await Promise.all([
          supabase.from('users').select('*').eq('id', id).maybeSingle(),
          getStaffAssignments(id)
        ]);

        if (active && teacherRes.data) {
          const t = teacherRes.data;
          setTeacher({
            uid: t.id,
            email: t.email,
            name: t.name,
            role: t.role as any,
            phone: t.phone,
            photoURL: t.photo_url,
            schoolId: t.school_id || 'tss-main-school',
            createdAt: t.created_at
          });
          setCurrentAssignments(assignData);
        }
      } catch (err) {
        console.error("Load teacher error from Supabase:", err);
      } finally {
        if (active) setTeacherLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [id]);

  const [formData, setFormData] = useState({
    name: "", 
    phone: "", 
    photoURL: "",
    selectedClasses: [] as string[],
    selectedSubjects: [] as string[]
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydrate Form Data once teacher & assignments are fetched
  useEffect(() => {
    if (teacher && !isInitialized.current) {
      const activeClassNames = Array.from(new Set(currentAssignments.map(a => a.className))).filter(Boolean);
      const activeSubjectIds = Array.from(new Set(currentAssignments.map(a => a.subjectId))).filter(Boolean);

      setFormData({
        name: teacher.name || "",
        phone: teacher.phone || "",
        photoURL: teacher.photoURL || "",
        selectedClasses: activeClassNames,
        selectedSubjects: activeSubjectIds
      });
      isInitialized.current = true;
    }
  }, [teacher, currentAssignments]);

  const availableSubjects = useMemo(() => {
    if (!settings?.subjects) return [];
    return settings.subjects;
  }, [settings?.subjects]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !schoolId) return;

    setUploading(true);
    try {
      const options = { maxSizeMB: 0.1, maxWidthOrHeight: 500, useWebWorker: false };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedFile);
      });
      const base64Data = await base64Promise;
      const result = await uploadToCloudinary(base64Data, `staff/${schoolId}`);
      if (result.success && result.url) {
        setFormData(prev => ({ ...prev, photoURL: result.url }));
        toast({ title: "Updated Photo Synced" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Failed" });
    } finally {
      setUploading(false);
    }
  };

  const toggleItem = (list: 'selectedClasses' | 'selectedSubjects', item: string) => {
    setFormData(prev => ({
      ...prev,
      [list]: prev[list].includes(item) ? prev[list].filter(i => i !== item) : [...prev[list], item]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId || !id || !settings) return;

    setLoading(true);
    try {
      // 1. Persist Staff Profile directly in Supabase
      await upsertStaff({
        uid: id,
        name: formData.name,
        phone: formData.phone,
        photoURL: formData.photoURL,
        role: teacher?.role || 'teacher',
        schoolId: schoolId || 'tss-main-school'
      });

      // 2. Clear old assignments for this teacher in Supabase
      if (currentAssignments && currentAssignments.length > 0) {
        await Promise.all(currentAssignments.map(a => deleteStaffAssignment(a.id)));
      }

      // 3. Persist new assignments in Supabase
      const newAssignments: Promise<boolean>[] = [];
      formData.selectedSubjects.forEach(subId => {
        const subjectMeta = availableSubjects.find(s => s.id === subId);
        formData.selectedClasses.forEach(className => {
          const assignmentId = `${id}_${className}_${subId}`.replace(/\s+/g, '_');
          newAssignments.push(upsertStaffAssignment({
            id: assignmentId,
            teacherId: id,
            teacherName: formData.name,
            className: className,
            sectionName: 'All',
            subject: subjectMeta?.name || 'Unknown',
            subjectName: subjectMeta?.name || 'Unknown',
            subjectId: subId,
            sessionId: settings.activeSession?.id || 'default'
          }));
        });
      });
      await Promise.all(newAssignments);

      toast({ title: "Workload Recalibrated", description: "Staff profile and mapping updated in Supabase." });
      router.push('/admin/teachers');
    } catch (error) {
      console.error("Update error:", error);
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || teacherLoading) return <div className="flex flex-col items-center justify-center min-h-[60vh]"><Loader2 className="h-10 w-10 animate-spin text-primary-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto pb-32 mt-6 px-4 sm:px-6">
      <header className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" className="rounded-full bg-white dark:bg-card shadow-sm border dark:border-white/5" asChild>
          <Link href="/admin/teachers"><ChevronLeft className="h-5 w-5 text-navy-900 dark:text-white" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit">Staff Profile Registry</h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Faculty Record: {id.slice(-6)}</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Identity & Personal Info Card */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-card rounded-[2.5rem] overflow-hidden bg-white dark:bg-card">
              <CardHeader className="bg-primary-600 p-8 text-white">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <User className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-outfit">Identity Profile</CardTitle>
                    <CardDescription className="text-white/60">Faculty personal credentials.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex flex-col items-center gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
                  <div className="w-32 h-32 rounded-3xl border-4 border-slate-50 dark:border-navy-900 bg-slate-100 dark:bg-navy-950 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                    {formData.photoURL ? (
                      <img src={formData.photoURL} alt="Teacher" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-12 w-12 text-slate-300 dark:text-slate-700" />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="animate-spin text-white h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <input type="file" id="teacher-photo-edit" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full text-[10px] font-black uppercase tracking-wider h-8 px-4 dark:text-white dark:border-white/10"
                    onClick={() => document.getElementById('teacher-photo-edit')?.click()}
                    disabled={uploading}
                  >
                    <Camera className="h-3.5 w-3.5 mr-1.5" />
                    {formData.photoURL ? 'Replace Visual' : 'Upload Visual'}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Faculty Full Name</Label>
                    <Input 
                      required 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="h-12 rounded-xl bg-slate-50 dark:bg-navy-950 border-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Workstation Contact Phone</Label>
                    <Input 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="h-12 rounded-xl bg-slate-50 dark:bg-navy-950 border-none font-bold font-mono"
                      placeholder="0300-1234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">System Registry Email</Label>
                    <Input 
                      disabled 
                      value={teacher?.email || ''} 
                      className="h-12 rounded-xl bg-slate-100 dark:bg-navy-900 border-none font-bold text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Academic Workload Allocation */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-none shadow-card rounded-[2.5rem] bg-white dark:bg-card">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-outfit flex items-center gap-3">
                  <GraduationCap className="h-6 w-6 text-primary-600" />
                  Academic Workload Allocation
                </CardTitle>
                <CardDescription>
                  Assign classes and discipline responsibility to this instructor.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-8">
                {/* Classes Section */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Assigned Classes</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {settings?.classes?.map(cls => {
                      const isSelected = formData.selectedClasses.includes(cls);
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => toggleItem('selectedClasses', cls)}
                          className={cn(
                            "flex items-center justify-between p-3.5 rounded-2xl border-2 text-left font-bold text-xs transition-all",
                            isSelected 
                              ? "border-primary-600 bg-primary-50/50 dark:bg-primary-950/20 text-primary-900 dark:text-primary-300 shadow-sm" 
                              : "border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-navy-950 text-slate-600 dark:text-slate-400 hover:border-slate-200"
                          )}
                        >
                          <span>{cls}</span>
                          {isSelected && <Check className="h-4 w-4 text-primary-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subjects Section */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Assigned Disciplines / Subjects</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {availableSubjects.map(sub => {
                      const isSelected = formData.selectedSubjects.includes(sub.id);
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => toggleItem('selectedSubjects', sub.id)}
                          className={cn(
                            "flex items-center justify-between p-3.5 rounded-2xl border-2 text-left font-bold text-xs transition-all",
                            isSelected 
                              ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 shadow-sm" 
                              : "border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-navy-950 text-slate-600 dark:text-slate-400 hover:border-slate-200"
                          )}
                        >
                          <span className="truncate">{sub.name}</span>
                          {isSelected && <Check className="h-4 w-4 text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-base shadow-xl shadow-primary-600/20 gap-2"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Recalibrate Workload
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
