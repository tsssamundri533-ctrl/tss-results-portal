
'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  UserPlus, 
  ChevronLeft, 
  Mail, 
  User, 
  Phone, 
  ShieldCheck, 
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Check,
  ImageIcon,
  Upload,
  Camera
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createTeacherAccount } from '@/app/actions/teacher-actions';
import { useAuthStore, FIXED_SCHOOL_ID } from '@/store/use-auth-store';
import { useSchoolStore } from '@/store/use-school-store';
import { useSchoolSettings } from '@/hooks/use-school-settings';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';
import { uploadToCloudinary } from '@/app/actions/cloudinary-upload';
import { cn } from '@/lib/utils';

export default function NewTeacherPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const schoolId = useAuthStore(state => state.schoolId);
  const settings = useSchoolStore(state => state.settings);
  const settingsLoading = useSchoolStore(state => state.isLoading);
  useSchoolSettings();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    photoURL: '',
    selectedClasses: [] as string[],
    selectedSubjects: [] as string[]
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const availableSubjects = useMemo(() => settings?.subjects || [], [settings?.subjects]);
  const availableClasses = useMemo(() => settings?.classes || [], [settings?.classes]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !schoolId) return;

    setUploading(true);
    try {
      const options = { maxSizeMB: 0.05, maxWidthOrHeight: 500, useWebWorker: false };
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
        toast({ title: "Staff Photo Captured" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId || !settings) return;

    if (formData.selectedClasses.length === 0 || formData.selectedSubjects.length === 0) {
      toast({ 
        variant: "destructive", 
        title: "Incomplete Workload", 
        description: "Assign at least one class and one subject." 
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createTeacherAccount({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        photoURL: formData.photoURL,
        password: formData.password || 'spirit533',
        selectedClasses: formData.selectedClasses,
        selectedSubjects: formData.selectedSubjects,
        availableSubjects,
        sessionId: settings.activeSession?.id || 'default'
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "Teacher Authorized",
        description: `Successfully enrolled ${formData.name} in Supabase.`,
      });
      router.push('/admin/teachers');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registration Blocked", description: error.message || "Registration failed." });
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (list: 'selectedClasses' | 'selectedSubjects', item: string) => {
    setFormData(prev => ({
      ...prev,
      [list]: prev[list].includes(item) ? prev[list].filter(i => i !== item) : [...prev[list], item]
    }));
  };

  if (!mounted || settingsLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-primary-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto pb-32 px-4 sm:px-6">
      <header className="flex items-center gap-3 mb-8 mt-6">
        <Button variant="ghost" size="icon" className="rounded-full bg-white dark:bg-card shadow-sm border border-slate-100 dark:border-white/5" asChild>
          <Link href="/admin/teachers"><ChevronLeft className="h-5 w-5 text-navy-900 dark:text-white" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit">Staff Onboarding</h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Faculty Account Matrix</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-card rounded-[2.5rem] overflow-hidden bg-white dark:bg-card">
              <CardHeader className="bg-primary-600 p-8 text-white">
                <CardTitle className="text-xl font-outfit flex items-center gap-3"><User className="h-6 w-6" /> Identity Profile</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex flex-col items-center gap-4">
                   <div className="w-40 h-40 rounded-[2.5rem] border-4 border-slate-50 dark:border-navy-900 bg-slate-100 dark:bg-navy-950 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                      {formData.photoURL ? <img src={formData.photoURL} alt="Staff" className="w-full h-full object-cover" /> : <ImageIcon className="h-12 w-12 text-slate-300 dark:text-slate-800" />}
                      {uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="animate-spin text-white h-8 w-8" /></div>}
                   </div>
                   <input type="file" id="staff-photo" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                   <Button type="button" variant="outline" size="sm" className="rounded-full px-6 text-[10px] uppercase font-black dark:text-white dark:border-white/10" onClick={() => document.getElementById('staff-photo')?.click()} disabled={uploading}>
                     <Camera className="h-3 w-3 mr-2" />
                     {formData.photoURL ? 'Replace Photo' : 'Upload ID Photo'}
                   </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Full Legal Name</Label>
                    <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Work Email</Label>
                    <Input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Secure Password</Label>
                    <div className="relative">
                      <Input required type={showPassword ? "text" : "password"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none pr-12 font-mono" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <Card className="border-none shadow-card rounded-[2.5rem] overflow-hidden bg-white dark:bg-card">
              <CardHeader className="bg-navy-900 p-8 text-white">
                 <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-outfit flex items-center gap-3"><BookOpen className="h-6 w-6" /> Authority Matrix</CardTitle>
                    <Badge className="bg-primary-600 text-white border-none">{formData.selectedClasses.length * formData.selectedSubjects.length} Load</Badge>
                 </div>
              </CardHeader>
              <CardContent className="p-8 grid md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <Label className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Subject Components</Label>
                  <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                    {availableSubjects.map((sub) => {
                      const isSelected = formData.selectedSubjects.includes(sub.id);
                      return (
                        <div key={sub.id} onClick={() => toggleItem('selectedSubjects', sub.id)} className={cn("p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between", isSelected ? "bg-primary-600 border-primary-600 text-white shadow-lg" : "bg-slate-50 dark:bg-white/5 border-transparent text-slate-500")}>
                          <div className="flex items-center gap-3"><div className={cn("w-5 h-5 rounded border flex items-center justify-center", isSelected ? "bg-white border-white" : "bg-transparent border-slate-300")}>{isSelected && <Check className="w-3 h-3 text-primary-600" strokeWidth={4} />}</div><span className="font-bold text-sm">{sub.name}</span></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-6">
                  <Label className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Assigned Grades</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                    {availableClasses.map((cls) => {
                      const isSelected = formData.selectedClasses.includes(cls);
                      return (
                        <div key={cls} onClick={() => toggleItem('selectedClasses', cls)} className={cn("p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-3", isSelected ? "bg-navy-900 dark:bg-primary-600 border-navy-900 text-white shadow-lg" : "bg-slate-50 dark:bg-white/5 border-transparent text-slate-400")}>
                          <div className="flex items-center justify-between"><GraduationCap className="h-4 w-4" /><div className={cn("w-4 h-4 rounded-sm border flex items-center justify-center", isSelected ? "bg-primary-500 border-primary-500" : "bg-transparent border-slate-300")}>{isSelected && <Check className="w-3 h-3 text-white" strokeWidth={4} />}</div></div>
                          <span className="text-xs font-black uppercase tracking-tighter">{cls}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button type="submit" className="w-full h-16 rounded-[2.5rem] bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest shadow-2xl gap-3 transition-all active:scale-95" disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
              Authorize Faculty Member
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
