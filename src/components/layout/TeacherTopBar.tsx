'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { SyncStatusBadge } from '@/components/common/SyncStatusBadge';
import { useAuthStore } from '@/store/use-auth-store';
import { useSchoolStore } from '@/store/use-school-store';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { ShieldCheck, Calendar } from 'lucide-react';
import { TermSwitcher } from './TermSwitcher';

export function TeacherTopBar() {
  const isOnline = useOnlineStatus();
  const { user, userName } = useAuthStore();
  const { settings } = useSchoolStore();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-surface-200 dark:border-white/5 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between shadow-sm transition-colors">
      <div className="flex items-center gap-4">
        <div className="flex flex-col md:hidden">
          <h1 className="text-[12px] font-outfit font-black text-navy-900 dark:text-white leading-none uppercase tracking-tight">
            {settings?.profile?.schoolName || 'The Spirit School Samundri'}
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
               {currentTime ? format(currentTime, 'EEEE, MMM do') : '...'}
             </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-surface-50 dark:bg-navy-950 rounded-full border dark:border-white/5 shadow-inner">
           <ShieldCheck className="h-4 w-4 text-emerald-500" />
           <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">Station: Authorized Faculty Workspace</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <TermSwitcher />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <SyncStatusBadge />
        </div>

        <Link href="/teacher/profile" className="md:hidden">
          <div className="h-10 w-10 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-black text-sm border-2 border-white dark:border-navy-800 shadow-xl transition-all active:scale-95">
            {userName?.[0] || user?.displayName?.[0] || 'T'}
          </div>
        </Link>
      </div>
    </header>
  );
}
