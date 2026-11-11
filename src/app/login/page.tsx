'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from '@/hooks/use-auth';
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  ArrowRight, 
  HelpCircle,
  Phone,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSchoolStore } from '@/store/use-school-store';
import { useSchoolSettings } from '@/hooks/use-school-settings';

const TSS_LOGO_FALLBACK = "https://res.cloudinary.com/dc4h1odcj/image/upload/v1740643729/tsss/Logo.png";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  
  const { login, error } = useAuth();
  
  // Real-time branding
  useSchoolSettings();
  const settings = useSchoolStore(state => state.settings);

  const logoUrl = settings?.profile?.logoURL || TSS_LOGO_FALLBACK;
  const rawSchoolName = settings?.profile?.schoolName || 'THE SPIRIT SCHOOL';
  const cleanSchoolName = rawSchoolName
    .replace(/\s*SAMUNDRI\s*CAMPUS\s*/gi, '')
    .replace(/\s*SAMUNDRI\s*/gi, '')
    .trim() || 'THE SPIRIT SCHOOL';

  const sessionTitle = settings?.activeSession?.title || '2026';
  const phone = settings?.profile?.phone || '0333-9114333 | 0345-9114333';
  const supportEmail = settings?.profile?.email || 'tss.samundri@gmail.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsSubmitting(true);
    await login(email.trim(), password);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 bg-[#080e1a] text-slate-100 font-inter selection:bg-blue-600/30">
      
      {/* Subtle Ambient Background Lighting (Clean & Serious) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-indigo-600/10 blur-[140px]" />
      </div>

      {/* Main Single-Card Container (Clean, Serious, High-End) */}
      <div className="relative w-full max-w-[460px] z-10 space-y-6">
        
        {/* The Card */}
        <div className="rounded-3xl border border-slate-800/90 bg-slate-900/85 p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          
          {/* Institutional Header */}
          <div className="text-center space-y-3 pb-6 border-b border-slate-800/80">
            {/* School Crest */}
            <div className="h-16 w-16 mx-auto rounded-2xl bg-white p-2 shadow-xl border border-white/20 flex items-center justify-center">
              <img 
                src={logoUrl} 
                alt="School Logo" 
                className="w-full h-full object-contain" 
                onError={(e) => { (e.target as HTMLImageElement).src = TSS_LOGO_FALLBACK; }}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl font-extrabold uppercase tracking-tight text-white font-outfit">
                  {cleanSchoolName}
                </h1>
                <span className="bg-rose-600 text-white font-black text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full">
                  SAMUNDRI
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400">
                Examination & Academic Management Portal
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/70 border border-slate-700/60 text-[11px] font-semibold text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Academic Session {sessionTitle}
            </div>
          </div>

          {/* Form Header */}
          <div className="pt-6 pb-2 text-center sm:text-left space-y-1">
            <h2 className="text-2xl font-black text-white font-outfit uppercase tracking-tight">
              Sign In
            </h2>
            <p className="text-xs text-slate-400 font-normal">
              Enter your institutional credentials to access your dashboard.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-3">
            
            {/* Error Banner */}
            {error && (
              <Alert variant="destructive" className="bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl p-3 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <AlertDescription className="text-xs font-semibold">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Email Address
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <Input 
                  id="login-email"
                  type="email" 
                  placeholder="name@tss.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-slate-800/80 border-slate-700/80 h-12 rounded-xl text-white placeholder:text-slate-500 pl-10 pr-4 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all font-medium text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Password
                </Label>
                <button 
                  type="button" 
                  onClick={() => setHelpDialogOpen(true)}
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <Input 
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-slate-800/80 border-slate-700/80 h-12 rounded-xl text-white placeholder:text-slate-500 pl-10 pr-11 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-blue-400" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center space-x-2.5 pt-1">
              <Checkbox 
                id="remember-me" 
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(!!checked)}
                className="data-[state=checked]:bg-blue-600 border-slate-600 rounded"
              />
              <label
                htmlFor="remember-me"
                className="text-xs font-medium text-slate-300 cursor-pointer select-none"
              >
                Keep me signed in on this device
              </label>
            </div>

            {/* Submit CTA Button */}
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold uppercase tracking-wider text-xs shadow-lg shadow-blue-600/30 transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 group mt-3"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Help Link */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => setHelpDialogOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
              <span>Need help or teacher access? Contact Support</span>
            </button>
          </div>
        </div>

        {/* Security Trust Strip */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500/80" />
          <span>256-Bit SSL Encrypted • Authorized Personnel Only</span>
        </div>

        {/* Executive Footer */}
        <footer className="text-center space-y-1 text-xs text-slate-500">
          <p className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
            THE SPIRIT SCHOOL SAMUNDRI CAMPUS
          </p>
          <p className="text-[11px]">
            Developed with pride by <span className="font-semibold text-slate-400">"Mian Mudassar"</span> • All Rights Reserved © {new Date().getFullYear()}
          </p>
        </footer>
      </div>

      {/* Support & Helpline Dialog */}
      <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-white max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-2 text-left">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-bold font-outfit text-white">
              Institutional Support & Access
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-xs leading-relaxed">
              For security compliance, user credentials and teacher accounts are registered by the campus administration. If you forgot your password or need teacher access, please contact the campus desk.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-3">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
              <Phone className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Campus Helpline</p>
                <p className="text-sm font-bold text-white tracking-wide">{phone}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Official Campus Email</p>
                <p className="text-sm font-bold text-white tracking-wide">{supportEmail}</p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setHelpDialogOpen(false)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl h-10 px-5 text-xs font-bold"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
