
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Save, 
  Phone, 
  Image as ImageIcon,
  Loader2,
  Upload,
  Globe,
  Mail,
  MapPin,
  PenTool,
  Hash,
  Sparkles,
  FileSignature,
  Layout
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { useSchoolStore } from '@/store/use-school-store';
import { SchoolProfile } from '@/types';
import imageCompression from 'browser-image-compression';
import { uploadToCloudinary } from '@/app/actions/cloudinary-upload';
import { cn } from '@/lib/utils';
import { updateSchoolSettings } from '@/lib/supabase-service';

export default function SchoolSettingsPage() {
  const { toast } = useToast();
  const { schoolId } = useAuthStore();
  const { settings, isLoading, setSettings } = useSchoolStore();
  
  const [profile, setProfile] = useState<Partial<SchoolProfile>>({
    schoolName: 'The Spirit School Samundri',
    schoolNameUrdu: '',
    address: 'Housing Colony #2 Samundri',
    phone: '0333-9114333',
    email: '',
    website: '',
    motto: 'Excellence in Education',
    logoURL: 'https://res.cloudinary.com/dc4h1odcj/image/upload/v1740643729/tsss/Logo.png',
    faviconURL: '',
    principalSignatureURL: '',
    directorSignatureURL: '',
    startingRollNumber: 1001,
  });

  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (settings?.profile && !isInitialized.current) {
      setProfile(prev => ({ ...prev, ...settings.profile }));
      isInitialized.current = true;
    }
  }, [settings]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof SchoolProfile) => {
    const file = e.target.files?.[0];
    if (!file || !schoolId) return;

    setUploadingField(field);
    try {
      const options = { 
        maxSizeMB: 0.1,
        maxWidthOrHeight: 800, 
        useWebWorker: false,
        initialQuality: 0.7
      };
      
      const compressedFile = await imageCompression(file, options);
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedFile);
      });
      const base64Data = await base64Promise;

      const result = await uploadToCloudinary(base64Data, `branding/${schoolId}`);
      
      if (result.success && result.url) {
        setProfile(prev => ({ ...prev, [field]: result.url }));
        toast({ title: "Asset Uploaded", description: `Branding item ${field} synchronized.` });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Upload Failed", 
        description: error.message || "Could not sync branding asset." 
      });
    } finally {
      setUploadingField(null);
    }
  };

  const handleSaveAll = async () => {
    try {
      const ok = await updateSchoolSettings({ profile });
      if (!ok) throw new Error("Failed to commit settings to Supabase");

      if (settings) {
        setSettings({ ...settings, profile: { ...settings.profile, ...profile } as any });
      }

      toast({
        title: "Configuration Saved",
        description: "Institutional branding and identity updated in database.",
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed" });
    }
  };

  if (isLoading && !isInitialized.current) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const AssetPreview = ({ url, field, label, icon: Icon = ImageIcon }: { url?: string, field: keyof SchoolProfile, label: string, icon?: any }) => (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full aspect-video sm:aspect-square rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center bg-slate-50 dark:bg-white/5 relative overflow-hidden group shadow-inner">
        {url ? (
          <img src={url} alt={label} className="w-full h-full object-contain p-4" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-300 dark:text-slate-600">
            <Icon className="h-10 w-10" />
            <span className="text-[8px] font-black uppercase tracking-widest">No Asset</span>
          </div>
        )}
        {uploadingField === field && (
          <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        )}
      </div>
      <div className="relative">
        <Input 
          type="file" 
          className="hidden" 
          id={`upload-${field}`}
          accept="image/*"
          onChange={(e) => handleFileUpload(e, field)}
        />
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          className="rounded-full h-9 px-6 text-[10px] uppercase font-black dark:text-white dark:border-white/10 hover:bg-primary-600 hover:text-white transition-all"
          onClick={() => document.getElementById(`upload-${field}`)?.click()}
          disabled={!!uploadingField}
        >
          <Upload className="h-3 w-3 mr-2" />
          {uploadingField === field ? 'Syncing...' : (url ? 'Change' : 'Upload')}
        </Button>
      </div>
      <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em]">{label}</span>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 px-4 sm:px-0">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit">School Configuration</h1>
          <p className="text-muted-foreground font-medium">Institutional branding, contact registry, and signatures.</p>
        </div>
        <Button onClick={handleSaveAll} className="rounded-full shadow-lg h-12 px-10 gap-2 font-black uppercase text-xs tracking-widest bg-primary-600 hover:bg-primary-700 text-white transition-all active:scale-95">
          <Save className="h-5 w-5" />
          Commit Changes
        </Button>
      </header>

      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="flex w-full bg-slate-100 dark:bg-white/5 p-1 rounded-2xl h-auto flex-wrap mb-8 gap-1">
          <TabsTrigger value="identity" className="flex-1 rounded-xl py-3 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-card dark:text-slate-400 dark:data-[state=active]:text-white font-bold">
            <Building2 className="h-4 w-4" /> Identity
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex-1 rounded-xl py-3 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-card dark:text-slate-400 dark:data-[state=active]:text-white font-bold">
            <ImageIcon className="h-4 w-4" /> Branding
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex-1 rounded-xl py-3 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-card dark:text-slate-400 dark:data-[state=active]:text-white font-bold">
            <Phone className="h-4 w-4" /> Contact
          </TabsTrigger>
        </TabsList>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            <TabsContent value="identity" className="m-0 space-y-6 animate-in fade-in duration-300">
              <Card className="border-none shadow-card rounded-[2.5rem] overflow-hidden bg-white dark:bg-card">
                <CardHeader className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 p-8">
                  <CardTitle className="text-xl font-outfit dark:text-white">Institutional Identity</CardTitle>
                  <CardDescription className="dark:text-slate-400">Core naming and academic philosophy.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1 tracking-widest">School Name (English)</Label>
                      <Input 
                        value={profile.schoolName || ""} 
                        onChange={e => setProfile({...profile, schoolName: e.target.value})}
                        className="h-14 rounded-2xl bg-slate-50 dark:bg-navy-950 border-none px-5 font-bold text-lg dark:text-white shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1 tracking-widest">School Name (Urdu)</Label>
                      <Input 
                        value={profile.schoolNameUrdu || ""} 
                        onChange={e => setProfile({...profile, schoolNameUrdu: e.target.value})}
                        dir="rtl"
                        className="h-14 rounded-2xl bg-slate-50 dark:bg-navy-950 border-none px-5 font-outfit text-right dark:text-white shadow-inner text-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1 tracking-widest">Institutional Motto / Slogan</Label>
                    <div className="relative">
                      <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-500" />
                      <Input 
                        value={profile.motto || ""} 
                        onChange={e => setProfile({...profile, motto: e.target.value})}
                        placeholder="e.g. Excellence in Education"
                        className="h-14 rounded-2xl bg-slate-50 dark:bg-navy-950 border-none pl-12 font-medium italic dark:text-white shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1 tracking-widest">Starting Roll Number</Label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        type="number"
                        value={profile.startingRollNumber || 1001} 
                        onChange={e => setProfile({...profile, startingRollNumber: parseInt(e.target.value) || 1001})}
                        className="h-14 rounded-2xl bg-slate-50 dark:bg-navy-950 border-none pl-12 font-black text-lg text-primary-600 dark:text-primary-400 shadow-inner"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branding" className="m-0 space-y-6 animate-in fade-in duration-300">
              <Card className="border-none shadow-card rounded-[2.5rem] overflow-hidden bg-white dark:bg-card">
                <CardHeader className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 p-8">
                  <CardTitle className="text-xl font-outfit dark:text-white">Official Visual Assets</CardTitle>
                  <CardDescription className="dark:text-slate-400">High-resolution logo, favicon, and executive signatures.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    <AssetPreview 
                      url={profile.logoURL} 
                      field="logoURL" 
                      label="School Logo" 
                      icon={ImageIcon}
                    />
                    <AssetPreview 
                      url={profile.faviconURL} 
                      field="faviconURL" 
                      label="Favicon (Tab Icon)" 
                      icon={Layout}
                    />
                    <AssetPreview 
                      url={profile.principalSignatureURL} 
                      field="principalSignatureURL" 
                      label="Principal Signature" 
                      icon={PenTool}
                    />
                    <AssetPreview 
                      url={profile.directorSignatureURL} 
                      field="directorSignatureURL" 
                      label="Director Signature" 
                      icon={FileSignature}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="m-0 space-y-6 animate-in fade-in duration-300">
              <Card className="border-none shadow-card rounded-[2.5rem] overflow-hidden bg-white dark:bg-card">
                <CardHeader className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 p-8">
                  <CardTitle className="text-xl font-outfit dark:text-white">Institutional Registry</CardTitle>
                  <CardDescription className="dark:text-slate-400">Contact details for official documentation headers.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1 tracking-widest">Physical Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        value={profile.address || ""} 
                        onChange={e => setProfile({...profile, address: e.target.value})}
                        className="h-14 rounded-2xl bg-slate-50 dark:bg-navy-950 border-none pl-12 font-medium dark:text-white shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1 tracking-widest">Primary Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          value={profile.phone || ""} 
                          onChange={e => setProfile({...profile, phone: e.target.value})}
                          className="h-14 rounded-2xl bg-slate-50 dark:bg-navy-950 border-none pl-12 font-bold dark:text-white shadow-inner"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1 tracking-widest">Official Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          type="email"
                          value={profile.email || ""} 
                          onChange={e => setProfile({...profile, email: e.target.value})}
                          className="h-14 rounded-2xl bg-slate-50 dark:bg-navy-950 border-none pl-12 font-medium dark:text-white shadow-inner"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 ml-1 tracking-widest">Institutional Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        value={profile.website || ""} 
                        onChange={e => setProfile({...profile, website: e.target.value})}
                        placeholder="https://www.thespiritschool.com"
                        className="h-14 rounded-2xl bg-slate-50 dark:bg-navy-950 border-none pl-12 font-medium dark:text-white shadow-inner"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-navy-900 dark:bg-card text-white sticky top-24">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-outfit">Identity Preview</CardTitle>
                <CardDescription className="text-white/40">Visualizing official branding.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-8">
                <div className="bg-white p-6 rounded-[2rem] border-4 border-white/10 min-h-[160px] flex flex-col items-center justify-center text-center gap-4 shadow-2xl">
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden shadow-inner">
                     {profile.logoURL ? (
                       <img src={profile.logoURL} className="w-full h-full object-contain p-2" alt="" />
                     ) : (
                       <Building2 className="h-10 w-10 text-slate-200" />
                     )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-outfit font-black text-lg leading-tight uppercase line-clamp-2 text-navy-900">{profile.schoolName || "The Spirit School Samundri"}</h4>
                    <p className="text-[10px] text-primary-600 font-black italic tracking-widest uppercase">{profile.motto || "Excellence in Education"}</p>
                  </div>
                </div>

                <div className="space-y-4">
                   <p className="text-[9px] font-black uppercase text-white/20 tracking-[0.3em] text-center">Security Assets</p>
                   <div className="grid grid-cols-3 gap-3">
                      <div className="h-16 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center p-1">
                         {profile.faviconURL ? (
                           <img src={profile.faviconURL} className="h-6 w-6 object-contain" alt="" />
                         ) : <Layout className="h-5 w-5 text-white/10" />}
                         <span className="text-[7px] font-bold text-white/40 uppercase mt-1">Favicon</span>
                      </div>
                      <div className="h-16 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center p-1">
                         {profile.principalSignatureURL ? (
                           <img src={profile.principalSignatureURL} className="h-6 object-contain" alt="" />
                         ) : <div className="h-6 w-8 bg-white/5 rounded animate-pulse" />}
                         <span className="text-[7px] font-bold text-white/40 uppercase mt-1">Principal</span>
                      </div>
                      <div className="h-16 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center p-1">
                         {profile.directorSignatureURL ? (
                           <img src={profile.directorSignatureURL} className="h-6 object-contain" alt="" />
                         ) : <div className="h-6 w-8 bg-white/5 rounded animate-pulse" />}
                         <span className="text-[7px] font-bold text-white/40 uppercase mt-1">Director</span>
                      </div>
                   </div>
                </div>

                <div className="p-5 bg-white/5 rounded-[1.5rem] border border-white/10 space-y-2">
                   <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-primary-400" />
                      <span className="text-[9px] font-black text-white/60 uppercase truncate">{profile.address || 'Address Not Set'}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-emerald-400" />
                      <span className="text-[9px] font-black text-white/60 uppercase">{profile.phone || 'Contact Not Set'}</span>
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
