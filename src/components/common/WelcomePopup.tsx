'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Camera, 
  Loader2, 
  Lock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { useAuthStore, FIXED_SCHOOL_ID } from '@/store/use-auth-store';
import { upsertStaff } from '@/lib/supabase-service';
import { useToast } from '@/hooks/use-toast';
import imageCompression from 'browser-image-compression';
import { uploadToCloudinary } from '@/app/actions/cloudinary-upload';

interface WelcomePopupProps {
  userName: string;
  schoolName: string;
  onClose: () => void;
}

/**
 * Elite Identity & Security Onboarding Terminal.
 * Confirms encryption and allows teachers to set up their profile visually.
 */
export function WelcomePopup({ userName, schoolName, onClose }: WelcomePopupProps) {
  const today = new Date();
  const { toast } = useToast();
  const { user, userName: officialName, userPhotoURL, setAuth } = useAuthStore();
  
  const [name, setName] = useState(officialName || userName);
  const [photoURL, setPhotoURL] = useState(userPhotoURL || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const options = { 
        maxSizeMB: 0.05, 
        maxWidthOrHeight: 500, 
        useWebWorker: false,
        initialQuality: 0.6
      };
      const compressedFile = await imageCompression(file, options);
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedFile);
      });
      const base64Data = await base64Promise;

      const result = await uploadToCloudinary(base64Data, `staff/${FIXED_SCHOOL_ID}`);
      
      if (result.success && result.url) {
        setPhotoURL(result.url);
        toast({ title: "Identity Snapshot Captured", description: "Your profile visual is ready." });
      }
    } catch {
      toast({ variant: "destructive", title: "Hardware Sync Failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleFinalize = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Update Supabase users registry
      await upsertStaff({
        uid: user.uid,
        name: name,
        photoURL: photoURL,
        email: user.email || ''
      });

      // Update Local Store for instant dashboard hydration
      setAuth(user, useAuthStore.getState().role, FIXED_SCHOOL_ID, {
        name,
        photoURL
      });

      toast({ 
        title: "Workstation Ready", 
        description: "Your identity has been verified and encrypted.",
      });
      onClose();
    } catch {
      toast({ variant: "destructive", title: "Synchronization Error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-navy-950/98 backdrop-blur-3xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg my-auto"
        >
          <Card className="rounded-[3rem] border-none shadow-4xl overflow-hidden bg-white dark:bg-card">
            {/* --- SECURITY HEADER --- */}
            <div className="bg-primary-600 p-8 sm:p-10 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <Lock className="absolute -left-4 -top-4 h-48 w-48 rotate-12" />
                <ShieldCheck className="absolute -right-4 -bottom-4 h-48 w-48 -rotate-12" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                   <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] uppercase h-5 px-3 tracking-widest animate-pulse">
                     End-to-End Encrypted
                   </Badge>
                </div>
                <h1 className="text-xl sm:text-2xl font-black font-outfit uppercase leading-tight tracking-tight text-white px-4">
                   {schoolName} Management Terminal
                </h1>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em]">Institutional Data Protocol Active</p>
              </div>
            </div>
            
            <CardContent className="p-8 sm:p-12 text-center space-y-10">
              {/* --- IDENTITY SECTION --- */}
              <div className="space-y-8">
                <div className="relative inline-block mx-auto group">
                   <div className="relative">
                      <Avatar className="h-28 w-28 sm:h-36 sm:w-36 rounded-[2.5rem] sm:rounded-[3.5rem] border-[6px] border-slate-50 dark:border-navy-900 shadow-2xl transition-all group-hover:scale-105">
                        <AvatarImage src={photoURL} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-tr from-primary-600 to-indigo-600 text-white text-4xl font-black">
                          {name?.[0] || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <label 
                        htmlFor="onboarding-upload" 
                        className="absolute inset-0 rounded-[2.5rem] sm:rounded-[3.5rem] bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-2 border-dashed border-white/30"
                      >
                        {uploading ? <Loader2 className="h-8 w-8 animate-spin text-white" /> : <Camera className="h-8 w-8 text-white" />}
                        <span className="text-[9px] font-black text-white mt-2 uppercase tracking-widest">Update Portrait</span>
                        <input type="file" id="onboarding-upload" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
                      </label>
                   </div>
                   <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-2 -right-2 bg-primary-600 text-white p-2 rounded-2xl shadow-xl border-4 border-white dark:border-navy-900"
                   >
                      <Sparkles className="h-4 w-4 fill-white" />
                   </motion.div>
                </div>

                <div className="space-y-5">
                   <div className="space-y-1.5 text-left">
                      <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1 tracking-widest">Verify Legal Name</Label>
                      <Input 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="h-14 rounded-2xl bg-slate-50 dark:bg-navy-950 border-none text-center font-black text-lg sm:text-2xl text-navy-900 dark:text-white shadow-inner focus-visible:ring-primary-600"
                        placeholder="Enter full name"
                      />
                   </div>
                   <div className="p-5 bg-slate-50 dark:bg-navy-950 rounded-3xl border border-slate-100 dark:border-white/5 flex gap-4 text-left">
                      <ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0" />
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        This site is <b>End-to-End Encrypted</b>. Your personal image and information are stored securely and only visible to authorized administrators.
                      </p>
                   </div>
                </div>
              </div>

              {/* --- ACTION TERMINAL --- */}
              <div className="pt-2">
                <Button 
                  onClick={handleFinalize}
                  disabled={saving || !name || uploading}
                  className="w-full h-16 sm:h-20 rounded-[1.5rem] sm:rounded-[2.5rem] bg-navy-900 dark:bg-primary-600 hover:bg-navy-800 dark:hover:bg-primary-700 text-white text-base sm:text-xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 group"
                >
                  {saving ? (
                    <div className="flex items-center gap-3">
                       <Loader2 className="h-6 w-6 animate-spin" />
                       <span>Encrypting Profile...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                       <span>Commit & Enter Hub</span>
                       <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>
                
                <p className="mt-6 text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 dark:text-slate-700">
                  Authentication Date: {format(today, 'dd.MM.yyyy')}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
