'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { 
  Edit3, 
  ChevronLeft, 
  User, 
  Upload, 
  Loader2, 
  Save, 
  AlertTriangle, 
  Plus 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { getStudentById, upsertStudent, updateSchoolSettings, checkDuplicateRollNumber } from '@/lib/supabase-service';
import { useAuthStore } from '@/store/use-auth-store';
import { useSchoolStore } from '@/store/use-school-store';
import { useSchoolSettings } from '@/hooks/use-school-settings';
import { useCacheStore } from '@/store/use-cache-store';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';
import { uploadToCloudinary } from '@/app/actions/cloudinary-upload';
import { cn } from '@/lib/utils';
import { Student } from '@/types';

const MALE_AVATAR = "https://i.postimg.cc/x1BZ31bs/male.png";
const FEMALE_AVATAR = "https://i.postimg.cc/7hgPwR8W/1487318.png";

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const routeParams = useParams();
  const id = unwrappedParams?.id || (routeParams?.id as string) || '';

  const { toast } = useToast();
  const router = useRouter();
  const { schoolId } = useAuthStore();
  
  useSchoolSettings();
  const { settings, setSettings } = useSchoolStore();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);

  const [formData, setFormData] = useState({
    name: "", 
    fatherName: "",
    gender: "male" as Student['gender'],
    rollNumber: "", 
    class: "", 
    section: "",
    corridor: "Corridor A" as Student['corridor'],
    photoURL: ""
  });

  // Direct authoritative fetch from Supabase
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function fetchStudent() {
      setLoadingStudent(true);
      try {
        const data = await getStudentById(id);
        if (isMounted && data) {
          setStudent(data);
          setFormData({
            name: data.name || "",
            fatherName: data.fatherName || "",
            gender: data.gender || "male",
            rollNumber: data.rollNumber ? String(data.rollNumber) : "",
            class: data.class || "",
            section: data.section || "",
            corridor: data.corridor || "Corridor A",
            photoURL: data.photoURL || ""
          });

          // Sync into local cache for directory
          const cacheKey = `schools/tss-main-school/students`;
          useCacheStore.getState().setDocumentCache(`${cacheKey}/${data.id}`, data);
        }
      } catch (err) {
        console.error("Failed to load student for edit:", err);
      } finally {
        if (isMounted) setLoadingStudent(false);
      }
    }

    fetchStudent();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const availableSections = useMemo(() => {
    if (!formData.class || !settings?.classSections) return [];
    return settings.classSections[formData.class] || [];
  }, [formData.class, settings?.classSections]);

  const handleClassChange = (cls: string) => {
    const sections = settings?.classSections?.[cls] || [];
    const firstSection = sections.length > 0 ? sections[0] : "";
    setFormData(prev => ({ ...prev, class: cls, section: firstSection }));
  };

  const handleQuickAddSection = async () => {
    if (!formData.class) {
      toast({ title: "Please select a class first", variant: "destructive" });
      return;
    }
    const name = window.prompt(`Enter new section name for ${formData.class} (e.g. GIRLS 2, BOYS 2):`);
    if (!name || !name.trim()) return;

    const trimmed = name.trim().toUpperCase();
    const currentSections = settings?.classSections?.[formData.class] || [];
    if (!currentSections.includes(trimmed)) {
      const updatedList = [...currentSections, trimmed];
      const updatedMap = {
        ...(settings?.classSections || {}),
        [formData.class]: updatedList
      };

      if (settings) {
        setSettings({ ...settings, classSections: updatedMap });
      }

      await updateSchoolSettings({ classSections: updatedMap });
      setFormData(prev => ({ ...prev, section: trimmed }));
      toast({ title: "Section Created", description: `Added ${trimmed} to ${formData.class}` });
    } else {
      setFormData(prev => ({ ...prev, section: trimmed }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const options = { maxSizeMB: 0.25, maxWidthOrHeight: 800, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const base64Promise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedFile);
      });
      const base64Data = await base64Promise;
      const result = await uploadToCloudinary(base64Data, `students/${schoolId || 'tss-main-school'}`);
      if (result.success && result.url) {
        setFormData(prev => ({ ...prev, photoURL: result.url }));
        toast({ title: "Updated Photo Captured" });
      } else throw new Error(result.error);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Error" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.class || !formData.section) {
      toast({ title: "Validation Error", description: "Mandatory profile fields missing.", variant: "destructive" });
      return;
    }

    setLoading(true);

    const trimmedRoll = formData.rollNumber.trim();
    if (trimmedRoll) {
      const dup = await checkDuplicateRollNumber(trimmedRoll, student?.id || id);
      if (dup.isDuplicate) {
        toast({ 
          title: "Duplicate Roll Number (رول نمبر پہلے سے موجود ہے)", 
          description: `Roll number ${trimmedRoll} is already assigned to ${dup.studentName} (${dup.studentClass} - ${dup.studentSection}).`, 
          variant: "destructive" 
        });
        setLoading(false);
        return;
      }
    }

    const studentPayload: Student = {
      ...(student || {}),
      ...formData,
      id: student?.id || id,
      schoolId: student?.schoolId || schoolId || 'tss-main-school',
      status: student?.status || 'active',
      qrToken: student?.qrToken || Math.random().toString(36).substring(2, 15),
      sessionId: student?.sessionId || settings?.activeSession?.id || 'session_2026'
    };

    try {
      // 1. Instant Cache Commit
      const cachePath = `schools/${schoolId || 'tss-main-school'}/students`;
      const currentList = useCacheStore.getState().collections[cachePath] || [];
      const updatedList = currentList.map((s: any) => s.id === studentPayload.id ? studentPayload : s);
      useCacheStore.getState().setCollectionCache(cachePath, updatedList);

      // 2. Persist to Supabase
      const ok = await upsertStudent(studentPayload);
      if (!ok) throw new Error("Supabase persistence failed");

      toast({ 
        title: "Profile Updated", 
        description: `${formData.name}'s profile has been updated.` 
      });

      router.push('/admin/students');
    } catch (err) {
      console.error("Save student error:", err);
      toast({ title: "Failed to save profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loadingStudent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">
          Loading Candidate Profile...
        </p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 text-center px-6">
        <div className="h-20 w-20 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-navy-900 dark:text-white font-outfit">Candidate Record Not Found</h2>
          <p className="text-muted-foreground max-w-xs">The requested identity profile could not be retrieved from the database.</p>
        </div>
        <Button asChild className="rounded-2xl h-12 px-8 bg-navy-900 dark:bg-primary-600">
          <Link href="/admin/students">Return to Directory</Link>
        </Button>
      </div>
    );
  }

  const currentDisplayPhoto = formData.photoURL || (formData.gender === 'female' ? FEMALE_AVATAR : MALE_AVATAR);

  return (
    <div className="max-w-4xl mx-auto pb-32 px-4 sm:px-6">
      <header className="flex items-center gap-3 mb-10 mt-6">
        <Button variant="ghost" size="icon" className="rounded-full bg-white dark:bg-card shadow-sm border border-slate-100 dark:border-white/5" asChild>
          <Link href="/admin/students"><ChevronLeft className="h-5 w-5 text-navy-900 dark:text-white" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit">Adjust Identity</h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
            {formData.name ? `${formData.name} • Roll: ${formData.rollNumber} (${formData.class})` : `Editing Registry ID: ${id.slice(-6)}`}
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-card rounded-[2.5rem] overflow-hidden bg-white dark:bg-card">
              <CardHeader className="bg-primary-600 p-8 text-white">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <User className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-outfit">Identity Assets</CardTitle>
                    <CardDescription className="text-white/60">Candidate profile visual.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex flex-col items-center gap-4">
                   <div className="w-40 h-40 rounded-[2.5rem] border-4 border-slate-50 dark:border-navy-900 bg-slate-100 dark:bg-navy-950 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                      <img src={currentDisplayPhoto} alt="Student" className="w-full h-full object-cover" />
                      {uploading && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                          <Loader2 className="animate-spin text-white h-8 w-8" />
                        </div>
                      )}
                   </div>
                   <input type="file" id="student-photo-edit" className="hidden" accept="image/*" onChange={handleFileUpload} />
                   <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full h-9 px-6 text-[10px] uppercase font-black dark:text-white dark:border-white/10"
                    onClick={() => document.getElementById('student-photo-edit')?.click()}
                    disabled={uploading}
                   >
                     <Upload className="h-3 w-3 mr-2" />
                     {formData.photoURL ? 'Replace Photo' : 'Capture ID Photo'}
                   </Button>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1">Legal Name</Label>
                    <Input 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="h-12 rounded-xl bg-slate-50 dark:bg-navy-950 border-none px-4 font-bold text-lg dark:text-white shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1">Father's Name</Label>
                    <Input 
                      required
                      value={formData.fatherName}
                      onChange={e => setFormData({...formData, fatherName: e.target.value})}
                      className="h-12 rounded-xl bg-slate-50 dark:bg-navy-950 border-none px-4 font-bold text-lg dark:text-white shadow-inner"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <Card className="border-none shadow-card rounded-[2.5rem] overflow-hidden bg-white dark:bg-card">
              <CardHeader className="p-8 border-b border-slate-50 dark:border-white/5">
                <CardTitle className="text-xl font-outfit">Enrolment Coordinates</CardTitle>
                <CardDescription>Academic and logistical placement parameters.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1">Roll Number</Label>
                    <Input 
                      required
                      value={formData.rollNumber}
                      onChange={e => setFormData({...formData, rollNumber: e.target.value})}
                      className="h-12 rounded-xl bg-slate-50 dark:bg-navy-950 border-none px-4 font-bold text-lg dark:text-white shadow-inner font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1">Gender</Label>
                    <Select 
                      value={formData.gender} 
                      onValueChange={(val: any) => setFormData({...formData, gender: val})}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-navy-950 border-none px-4 font-bold dark:text-white shadow-inner">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl dark:bg-navy-900 dark:border-white/10">
                        <SelectItem value="male" className="font-bold">Male Candidate</SelectItem>
                        <SelectItem value="female" className="font-bold">Female Candidate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1">Grade Class</Label>
                    <Select 
                      value={formData.class} 
                      onValueChange={handleClassChange}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-navy-950 border-none px-4 font-bold dark:text-white shadow-inner">
                        <SelectValue placeholder="Assign Grade" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl dark:bg-navy-900 dark:border-white/10">
                        {(settings?.classes || [formData.class]).filter(Boolean).map(cls => (
                          <SelectItem key={cls} value={cls} className="font-bold">{cls}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1">Section</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleQuickAddSection}
                        className="h-6 px-2 text-[10px] text-primary-600 font-bold hover:bg-primary-50 dark:hover:bg-primary-950/40 gap-1 rounded-md"
                      >
                        <Plus className="h-3 w-3" />
                        <span>+ New Section</span>
                      </Button>
                    </div>
                    <Select 
                      value={formData.section} 
                      onValueChange={(val: any) => setFormData({...formData, section: val})}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-navy-950 border-none px-4 font-bold dark:text-white shadow-inner">
                        <SelectValue placeholder="Assign Section" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl dark:bg-navy-900 dark:border-white/10">
                        {availableSections.length > 0 ? (
                          availableSections.map(sec => (
                            <SelectItem key={sec} value={sec} className="font-bold">Section {sec}</SelectItem>
                          ))
                        ) : (
                          formData.section ? (
                            <SelectItem value={formData.section} className="font-bold">Section {formData.section}</SelectItem>
                          ) : (
                            <SelectItem value="A" className="font-bold">Section A</SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1">Examination Hall / Zone (امتحانی ہال / زون)</Label>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Used for Seating Plans & Slips</span>
                  </div>
                  <Select 
                    value={formData.corridor} 
                    onValueChange={(val: any) => setFormData({...formData, corridor: val})}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-navy-950 border-none px-4 font-bold dark:text-white shadow-inner">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl dark:bg-navy-900 dark:border-white/10">
                      <SelectItem value="Corridor A" className="font-bold">Zone A (Main Examination Hall / مرکزی ہال)</SelectItem>
                      <SelectItem value="Corridor B" className="font-bold">Zone B (Secondary Wing / ثانوی ونگ)</SelectItem>
                      <SelectItem value="Corridor C" className="font-bold">Zone C (Junior Block / جونیئر بلاک)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-base shadow-xl gap-2 transition-all active:scale-[0.99]"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                    Commit Profile Updates
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
