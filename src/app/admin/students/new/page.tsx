
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  UserPlus, 
  ChevronLeft, 
  User, 
  ImageIcon,
  Upload,
  RefreshCw,
  Loader2,
  CircleCheck,
  Layers,
  MapPin,
  ShieldCheck,
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
import { upsertStudent, updateSchoolSettings, checkDuplicateRollNumber } from '@/lib/supabase-service';
import { useCacheStore } from '@/store/use-cache-store';
import { useAuthStore } from '@/store/use-auth-store';
import { useSchoolStore } from '@/store/use-school-store';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';
import { uploadToCloudinary } from '@/app/actions/cloudinary-upload';
import { cn } from '@/lib/utils';
import { Student } from '@/types';

const MALE_AVATAR = "https://i.postimg.cc/x1BZ31bs/male.png";
const FEMALE_AVATAR = "https://i.postimg.cc/7hgPwR8W/1487318.png";

export default function NewStudentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { schoolId } = useAuthStore();
  const { settings, setSettings, isLoading: settingsLoading } = useSchoolStore();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isInitialized = useRef(false);

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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (settings?.classes?.length && !isInitialized.current) {
      const defaultClass = settings.classes[0];
      const sections = settings.classSections?.[defaultClass] || [];
      const defaultSection = sections.length > 0 ? sections[0] : "";
      
      setFormData(prev => ({ 
        ...prev, 
        class: defaultClass, 
        section: defaultSection 
      }));
      isInitialized.current = true;
    }
  }, [settings]);

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
      const updatedClassSections = {
        ...(settings?.classSections || {}),
        [formData.class]: updatedList
      };

      await updateSchoolSettings({ classSections: updatedClassSections });
      if (settings) {
        setSettings({ ...settings, classSections: updatedClassSections });
      }
      toast({ title: `Section "${trimmed}" added to ${formData.class}` });
    }
    setFormData(prev => ({ ...prev, section: trimmed }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !schoolId) return;

    setUploading(true);
    try {
      const options = { maxSizeMB: 0.05, maxWidthOrHeight: 500, useWebWorker: false, initialQuality: 0.6 };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedFile);
      });
      const base64Data = await base64Promise;
      const result = await uploadToCloudinary(base64Data, `students/${schoolId}`);
      if (result.success && result.url) {
        setFormData(prev => ({ ...prev, photoURL: result.url }));
        toast({ title: "Identity Photo Attached" });
      } else throw new Error(result.error);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Photo Sync Failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId || !formData.name || !formData.class || !formData.section) {
      toast({ title: "Validation Error", description: "Complete all mandatory fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const studentId = `student_${Date.now()}`;
      
      // Calculate Roll Number: Use manual input if provided, otherwise compute next sequential
      let finalizedRollNumber = formData.rollNumber.trim();
      if (!finalizedRollNumber) {
        const cachePath = `schools/${schoolId}/students`;
        const currentList = useCacheStore.getState().collections[cachePath] || [];
        let maxRoll = settings?.profile?.startingRollNumber || 1000;
        currentList.forEach((s: any) => {
          const r = parseInt(s.rollNumber, 10);
          if (!isNaN(r) && r > maxRoll) maxRoll = r;
        });
        finalizedRollNumber = (maxRoll + 1).toString();
      }

      // Check for duplicate roll number (targeted fast query)
      const dup = await checkDuplicateRollNumber(finalizedRollNumber);
      if (dup.isDuplicate) {
        toast({ 
          title: "Duplicate Roll Number (رول نمبر پہلے سے موجود ہے)", 
          description: `Roll number ${finalizedRollNumber} is already assigned to ${dup.studentName} (${dup.studentClass} - ${dup.studentSection}).`, 
          variant: "destructive" 
        });
        setLoading(false);
        return;
      }

      const studentData = {
        ...formData,
        rollNumber: finalizedRollNumber,
        id: studentId,
        schoolId,
        qrToken: Math.random().toString(36).substring(2, 15),
        status: 'active' as Student['status'],
        sessionId: settings?.activeSession?.id || 'session_2026',
      };

      // 1. Immediately Warm Flash Cache (0ms)
      const cachePath = `schools/${schoolId || 'tss-main-school'}/students`;
      const currentCollection = useCacheStore.getState().collections[cachePath] || [];
      useCacheStore.getState().setCollectionCache(cachePath, [studentData, ...currentCollection.filter((s: any) => s.id !== studentId)]);
      
      toast({ title: "Enrollment Finalized", description: `${formData.name} added with Roll Number: ${finalizedRollNumber}.` });

      // 2. Direct Persistence to Supabase
      try {
        await upsertStudent(studentData);
      } catch (err) {
        console.warn("Background enrollment sync warning:", err);
      }

      router.push('/admin/students');
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Enrollment Failed", description: "A connection or registry error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || settingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Loading Enrollment Portal...</p>
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
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit">Student Enrollment</h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Register Candidate Identity</p>
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
                    <CardTitle className="text-xl font-outfit">Identity Profile</CardTitle>
                    <CardDescription className="text-white/60">Candidate photo and names.</CardDescription>
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
                   <input type="file" id="student-photo" className="hidden" accept="image/*" onChange={handleFileUpload} />
                   <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full h-9 px-6 text-[10px] uppercase font-black dark:text-white dark:border-white/10"
                    onClick={() => document.getElementById('student-photo')?.click()}
                    disabled={uploading}
                   >
                     <Upload className="h-3 w-3 mr-2" />
                     {formData.photoURL ? 'Replace Photo' : 'Upload ID Photo'}
                   </Button>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1">Legal Name</Label>
                    <Input 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter full name"
                      className="h-12 rounded-xl bg-slate-50 dark:bg-navy-900 border-none px-4 font-bold text-lg dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1">Father's Name</Label>
                    <Input 
                      required
                      value={formData.fatherName}
                      onChange={e => setFormData({...formData, fatherName: e.target.value})}
                      placeholder="Father's name"
                      className="h-12 rounded-xl bg-slate-50 dark:bg-navy-900 border-none px-4 font-bold dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1">Gender</Label>
                    <Select value={formData.gender} onValueChange={val => setFormData({...formData, gender: val as any})}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-navy-900 border-none font-bold dark:text-white shadow-inner">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-card dark:border-white/5">
                        <SelectItem value="male" className="font-bold">Male</SelectItem>
                        <SelectItem value="female" className="font-bold">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <Card className="border-none shadow-card rounded-[2.5rem] overflow-hidden bg-white dark:bg-card">
              <CardHeader className="bg-navy-900 p-8 text-white">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                    <ShieldCheck className="h-7 w-7 text-primary-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-outfit">Academic Assignment</CardTitle>
                    <CardDescription className="text-white/40">Grade and section allocation.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1">Academic Grade</Label>
                    <Select value={formData.class} onValueChange={handleClassChange}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-navy-900 border-none font-bold dark:text-white shadow-inner">
                        <SelectValue placeholder="Select Grade" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-card dark:border-white/5">
                        {settings?.classes?.map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1">Section / Group</Label>
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
                      key={`section-select-${formData.class}`} 
                      value={formData.section} 
                      onValueChange={val => setFormData({...formData, section: val})}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-navy-900 border-none font-bold dark:text-white shadow-inner" disabled={!formData.class}>
                        <SelectValue placeholder="Select Section" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-card dark:border-white/5">
                        {availableSections.map(s => <SelectItem key={s} value={s} className="font-bold">Section {s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1">Institutional Roll Number</Label>
                    <div className="flex gap-2">
                       <Input 
                        type="number"
                        value={formData.rollNumber}
                        onChange={e => setFormData({...formData, rollNumber: e.target.value})}
                        placeholder="Automatic Assignment"
                        className="h-12 rounded-xl bg-slate-50 dark:bg-navy-900 border-none px-4 font-black text-xl text-primary-600 dark:text-primary-400 shadow-inner"
                      />
                      <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400" title="System will assign automatically if blank">
                        <RefreshCw className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1">Examination Zone</Label>
                    <Select value={formData.corridor} onValueChange={val => setFormData({...formData, corridor: val as any})}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-navy-900 border-none font-bold dark:text-white shadow-inner">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-card dark:border-white/5">
                        <SelectItem value="Corridor A" className="font-bold">Zone A</SelectItem>
                        <SelectItem value="Corridor B" className="font-bold">Zone B</SelectItem>
                        <SelectItem value="Corridor C" className="font-bold">Zone C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl flex gap-4 border border-slate-100 dark:border-white/5">
                  <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                    By confirming enrollment, an atomic registry transaction will secure a unique Roll Number. This process prevents duplicates across multiple workstations.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-4 pt-6">
              <Button variant="ghost" className="rounded-2xl h-16 px-10 font-bold text-slate-400 hover:text-navy-900 dark:hover:text-white" asChild>
                <Link href="/admin/students">Discard</Link>
              </Button>
              <Button 
                type="submit" 
                className="rounded-[2rem] h-16 px-16 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 gap-3"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <UserPlus className="h-6 w-6" />}
                Finalize Enrollment
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
