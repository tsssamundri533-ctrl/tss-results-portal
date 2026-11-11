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
    <header className="h-14 sm:h-16 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-surface-200 dark:border-white/5 sticky top-0 z-40 px-3 sm:px-6 md:px-8 flex items-center justify-between shadow-sm transition-colors">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div className="flex flex-col md:hidden min-w-0">
          <h1 className="text-[11px] sm:text-xs font-outfit font-black text-navy-900 dark:text-white leading-tight uppercase tracking-tight truncate max-w-[110px] xs:max-w-[150px]">
            {settings?.profile?.schoolName || 'TSS Samundri'}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
             <span className="text-[7.5px] sm:text-[8px] text-slate-400 font-bold uppercase tracking-widest truncate">
               {currentTime ? format(currentTime, 'EEE, MMM d') : '...'}
             </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-surface-50 dark:bg-navy-950 rounded-full border dark:border-white/5 shadow-inner">
           <ShieldCheck className="h-4 w-4 text-emerald-500" />
           <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">Station: Authorized Faculty Workspace</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <TermSwitcher />
        <ThemeToggle />
        <SyncStatusBadge />

        <Link href="/teacher/profile" className="md:hidden shrink-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary-600 flex items-center justify-center text-white font-black text-xs border border-white/20 shadow-md transition-all active:scale-95">
            {userName?.[0] || user?.displayName?.[0] || 'T'}
          </div>
        </Link>
      </div>
    </header>
  );
}
