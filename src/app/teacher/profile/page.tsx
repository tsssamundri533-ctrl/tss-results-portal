'use client';

import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  LogOut, 
  Building,
  Settings,
  Camera,
  Save,
  Lock,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore, FIXED_SCHOOL_ID } from '@/store/use-auth-store';
import { useSchoolStore } from '@/store/use-school-store';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import imageCompression from 'browser-image-compression';
import { uploadToCloudinary } from '@/app/actions/cloudinary-upload';
import { cn } from '@/lib/utils';

export default function TeacherProfilePage() {
  const { user, role, userName, userPhotoURL, setAuth } = useAuthStore();
  const { settings } = useSchoolStore();
  const { logout } = useAuth();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [formData, setFormData] = useState({
    name: userName || '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

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

      const result = await uploadToCloudinary(base64Data, `staff/${FIXED_SCHOOL_ID}`);
      
      if (result.success && result.url) {
        const userEmail = user.email?.toLowerCase();
        if (userEmail) {
          await supabase.from('users').update({
            photo_url: result.url,
            updated_at: new Date().toISOString()
          }).eq('email', userEmail);
        }
        await supabase.auth.updateUser({ data: { photoURL: result.url } });
        setAuth(user, role, FIXED_SCHOOL_ID, { name: userName || undefined, photoURL: result.url });
        toast({ title: "Photo Updated", description: "Profile photo synchronized successfully." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !formData.name) return;
    
    setLoading(true);
    try {
      const userEmail = user.email?.toLowerCase();

      // 1. Update Name in Supabase users table
      if (userEmail) {
        await supabase.from('users').update({
          name: formData.name,
          updated_at: new Date().toISOString()
        }).eq('email', userEmail);
      }

      await supabase.auth.updateUser({ data: { name: formData.name } });
      setAuth(user, role, FIXED_SCHOOL_ID, { name: formData.name, photoURL: userPhotoURL || undefined });

      // 2. Update Password if requested
      if (showPasswordForm && formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          toast({ variant: "destructive", title: "Password Mismatch", description: "Confirm password does not match." });
          setLoading(false);
          return;
        }
        if (formData.newPassword.length < 6) {
          toast({ variant: "destructive", title: "Password Too Short", description: "Password must be at least 6 characters." });
          setLoading(false);
          return;
        }
        const { error: passError } = await supabase.auth.updateUser({ password: formData.newPassword });
        if (passError) throw passError;
        toast({ title: "Security Credentials Updated", description: "Your new password is now active." });
      }

      toast({ title: "Profile Synchronized", description: "Identity records updated successfully." });
      setIsEditing(false);
      setShowPasswordForm(false);
      setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({ variant: "destructive", title: "Update Error", description: error.message || "Failed to update security credentials." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-32 px-4 sm:px-0">
      <header className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy-900 dark:text-white font-outfit uppercase">Identity Hub</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-[9px] sm:text-[10px] mt-1">Institutional Faculty Credentials</p>
        </div>
        <Button 
          variant={isEditing ? "ghost" : "outline"} 
          className="rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-5 gap-2 border-2 dark:border-white/10 dark:text-white"
          onClick={() => {
            if (isEditing) handleUpdateProfile();
            else setIsEditing(true);
          }}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isEditing ? <Save className="h-3.5 w-3.5" /> : <Settings className="h-3.5 w-3.5" />}
          {isEditing ? 'Commit Changes' : 'Manage Profile'}
        </Button>
      </header>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-card rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-white dark:bg-card transition-colors border dark:border-white/5">
            <div className="h-24 sm:h-32 bg-primary-600 relative overflow-hidden">
               <Building className="absolute -right-4 -bottom-4 h-20 sm:h-24 w-20 sm:w-24 text-white/10 rotate-12" />
            </div>
            <CardContent className="p-6 sm:p-8 pt-0 -mt-10 sm:-mt-12 text-center relative z-10">
              <div className="relative inline-block mx-auto mb-4 group">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-white dark:border-card shadow-2xl rounded-[1.8rem] sm:rounded-[2.2rem] bg-slate-50 dark:bg-navy-900 transition-transform group-hover:scale-105">
                  <AvatarImage src={userPhotoURL || undefined} className="object-cover" />
                  <AvatarFallback className="font-bold text-2xl sm:text-3xl bg-primary-50 text-primary-600">
                    {userName ? userName[0].toUpperCase() : 'T'}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 p-2 bg-navy-900 dark:bg-primary-600 text-white rounded-xl shadow-lg cursor-pointer hover:scale-110 transition-transform">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
                  </label>
                )}
              </div>
              <h3 className="font-bold text-lg sm:text-xl text-navy-900 dark:text-white font-outfit">{userName}</h3>
              <p className="text-xs text-muted-foreground font-medium mt-0.5 truncate max-w-[200px] mx-auto">{user?.email}</p>
              
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                 <Badge variant="outline" className="border-none bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-bold uppercase text-[9px] tracking-wider px-2.5 py-0.5">
                   {role || 'Teacher'}
                 </Badge>
                 <Badge variant="outline" className="border-none bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[9px] tracking-wider px-2.5 py-0.5 flex items-center gap-1">
                   <ShieldCheck className="h-3 w-3" /> Active Faculty
                 </Badge>
              </div>

              <div className="mt-6 sm:mt-8 pt-6 border-t border-slate-100 dark:border-white/5 space-y-3">
                 <Button 
                   variant="ghost" 
                   onClick={logout}
                   className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold text-xs uppercase tracking-widest gap-2 rounded-xl h-11"
                 >
                   <LogOut className="h-4 w-4" /> Terminate Session
                 </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-card rounded-[2rem] sm:rounded-[2.5rem] bg-white dark:bg-card border dark:border-white/5">
             <CardHeader className="p-6 sm:p-8 pb-4">
                <CardTitle className="text-lg sm:text-xl font-outfit flex items-center gap-2">
                  <User className="h-5 w-5 text-primary-600" />
                  Faculty Identity Records
                </CardTitle>
                <CardDescription className="text-xs">
                  Your academic credentials as registered in The Spirit School ledger.
                </CardDescription>
             </CardHeader>
             <CardContent className="p-6 sm:p-8 pt-0 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Display Name</Label>
                    <Input 
                      disabled={!isEditing} 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="h-11 rounded-xl bg-slate-50 dark:bg-navy-950 border-none font-bold text-sm shadow-inner"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email (System ID)</Label>
                    <Input 
                      disabled 
                      value={user?.email || ''} 
                      className="h-11 rounded-xl bg-slate-100 dark:bg-navy-900 border-none font-bold text-sm text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                   <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-sm text-navy-900 dark:text-white flex items-center gap-2">
                          <Lock className="h-4 w-4 text-primary-600" />
                          Security & Password Management
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Change your personal login password anytime.
                        </p>
                      </div>
                      <Button 
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!isEditing}
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="rounded-xl text-[10px] font-black uppercase tracking-wider h-8"
                      >
                        {showPasswordForm ? 'Cancel Password Change' : 'Change Password'}
                      </Button>
                   </div>

                   {showPasswordForm && (
                      <div className="p-4 sm:p-6 bg-slate-50 dark:bg-navy-950 rounded-2xl space-y-4 border border-slate-100 dark:border-white/5 animate-in fade-in-50 duration-200">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">New Password (Min 6 Characters)</Label>
                          <div className="relative">
                            <Input 
                              type={showPass ? "text" : "password"}
                              value={formData.newPassword}
                              onChange={e => setFormData({...formData, newPassword: e.target.value})}
                              placeholder="Enter new strong password"
                              className="h-11 rounded-xl bg-white dark:bg-card border-none font-mono text-sm pr-10 shadow-inner"
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowPass(!showPass)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-900"
                            >
                              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Confirm New Password</Label>
                          <Input 
                            type="password"
                            value={formData.confirmPassword}
                            onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                            placeholder="Re-enter new password"
                            className="h-11 rounded-xl bg-white dark:bg-card border-none font-mono text-sm shadow-inner"
                          />
                        </div>
                      </div>
                   )}
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
