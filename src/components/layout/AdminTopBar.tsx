
'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { SyncStatusBadge } from '@/components/common/SyncStatusBadge';
import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { AdminSidebar } from './AdminSidebar';
import { TermSwitcher } from './TermSwitcher';
import { useSchoolStore } from '@/store/use-school-store';
import { useUIStore } from '@/store/use-ui-store';
import { cn } from '@/lib/utils';

export function AdminTopBar() {
  const isOnline = useOnlineStatus();
  const settings = useSchoolStore(state => state.settings);
  const { isSidebarLocked } = useUIStore();
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-white/80 dark:bg-navy-900/80 border-b border-surface-200 dark:border-white/5 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between shadow-sm backdrop-blur-xl transition-all duration-300">
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        {mounted ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-foreground h-11 w-11 hover:bg-slate-100 dark:hover:bg-white/5">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-none w-[280px] bg-navy-900">
              <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
              <SheetDescription className="sr-only">Mobile navigation sidebar for admin portal</SheetDescription>
              <AdminSidebar isMobile />
            </SheetContent>
          </Sheet>
        ) : (
          <Button variant="ghost" size="icon" className="md:hidden text-foreground h-11 w-11 opacity-50" disabled>
            <Menu className="w-5 h-5" />
          </Button>
        )}
        
        <div className="relative max-w-sm w-full hidden md:block group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary-600" />
          <Input 
            placeholder="Institutional search..." 
            className="pl-11 h-10 bg-surface-50 dark:bg-navy-950 border-surface-200 dark:border-white/5 focus-visible:ring-primary-600 rounded-[1.25rem] text-[13px] font-medium" 
          />
        </div>

        <div className="md:hidden flex items-center ml-1">
           <span className="font-outfit font-black text-[11px] uppercase tracking-tighter text-navy-900 dark:text-white truncate max-w-[140px]">
             {settings?.profile?.schoolName || 'TSSS'}
           </span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <TermSwitcher />
        <div className="flex items-center gap-1.5 md:gap-3">
          <ThemeToggle />
          <SyncStatusBadge />
        </div>

        <div className="hidden lg:flex flex-col items-end min-w-[130px] border-l border-slate-100 dark:border-white/5 pl-5">
          {time ? (
            <>
              <span className="text-[12px] font-black text-navy-900 dark:text-white font-outfit uppercase tracking-tight">{format(time, 'EEEE, MMM do')}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{format(time, 'hh:mm aa')}</span>
            </>
          ) : (
            <div className="space-y-1">
              <div className="h-3 w-20 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
              <div className="h-2 w-14 bg-slate-100 dark:bg-white/5 rounded animate-pulse ml-auto" />
            </div>
          )}
        </div>

        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-primary-600 h-10 w-10 rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-navy-900 shadow-sm"></span>
        </Button>
      </div>
    </header>
  );
}
