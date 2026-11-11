
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  PenLine, 
  QrCode, 
  CalendarCheck, 
  User, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Pin,
  PinOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/use-auth-store';
import { useSchoolStore } from '@/store/use-school-store';
import { useUIStore } from '@/store/use-ui-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/teacher/dashboard', icon: Home },
  { label: 'Marks Entry', href: '/teacher/marks', icon: PenLine },
  { label: 'Attendance', href: '/teacher/attendance', icon: CalendarCheck },
  { label: 'Scan QR Code', href: '/teacher/scan', icon: QrCode, special: true },
  { label: 'My Profile', href: '/teacher/profile', icon: User },
];

export function TeacherSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const { settings } = useSchoolStore();
  const { isSidebarLocked, toggleSidebarLock } = useUIStore();
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isExpanded = isSidebarLocked || isHovered;
  const width = isExpanded ? 'w-[260px]' : 'w-[72px]';

  if (!mounted) return null;

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "h-full bg-navy-900 dark:bg-navy-950 text-white transition-all duration-300 z-50 fixed left-0 top-0 md:flex hidden flex-col border-r border-white/5 shadow-2xl",
        width
      )}
    >
      {/* Branding Header */}
      <div className="h-16 flex items-center px-4 border-b border-white/5 shrink-0 overflow-hidden">
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shrink-0 border border-white/20 shadow-lg">
             {settings?.profile?.logoURL ? (
               <img src={settings.profile.logoURL} alt="Logo" className="w-full h-full object-contain p-1" />
             ) : (
               <Zap className="h-5 w-5 text-white" />
             )}
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col truncate"
              >
                <span className="font-outfit font-black text-sm uppercase tracking-tighter truncate leading-none">
                  {settings?.profile?.schoolName || 'The Spirit School'}
                </span>
                <span className="text-[9px] font-black text-primary-400 uppercase tracking-[0.2em] mt-1">Faculty Access</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-8 px-3 space-y-8 overflow-y-auto custom-scrollbar">
        <nav className="space-y-2">
          <TooltipProvider delayDuration={0}>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/teacher/dashboard' && pathname.startsWith(item.href));
              
              const content = (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 h-12 rounded-2xl transition-all group relative",
                    item.special && isExpanded ? "bg-primary-600/10 border border-primary-500/20 text-primary-400" : 
                    isActive 
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-900/50" 
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 shrink-0", 
                    isActive ? "text-white" : item.special ? "text-primary-400" : "text-white/30 group-hover:text-white/60"
                  )} />
                  {isExpanded && (
                    <span className="text-sm font-bold tracking-tight">{item.label}</span>
                  )}
                </Link>
              );

              if (!isExpanded) {
                return (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right" className="bg-navy-800 text-white font-black uppercase text-[10px] tracking-widest px-3 py-2 border-white/10">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <React.Fragment key={item.label}>{content}</React.Fragment>;
            })}
          </TooltipProvider>
        </nav>
      </div>

      {/* User Terminal */}
      <div className="p-4 border-t border-white/5 bg-navy-950/50 space-y-4">
        <div className={cn("flex items-center gap-3", !isExpanded ? "justify-center" : "")}>
          <div className="relative">
            <Avatar className="w-10 h-10 rounded-2xl border-2 border-white/10 shadow-xl">
              <AvatarImage src={user?.photoURL || ''} />
              <AvatarFallback className="bg-primary-700 text-white text-xs font-black">{user?.displayName?.[0] || 'T'}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-navy-900 animate-pulse"></div>
          </div>
          {isExpanded && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-black truncate leading-none text-white">{user?.displayName || 'Teacher'}</span>
              <span className="text-[10px] text-white/30 uppercase font-black tracking-widest mt-1">Verified Staff</span>
            </div>
          )}
          {isExpanded && (
            <Button variant="ghost" size="icon" onClick={logout} className="text-white/20 hover:text-rose-400 hover:bg-rose-500/10 h-9 w-9 rounded-xl transition-colors">
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleSidebarLock}
          className={cn(
            "w-full h-8 rounded-lg transition-all",
            isSidebarLocked 
              ? "bg-primary-600/20 text-primary-400" 
              : "text-white/10 hover:text-white/50 hover:bg-white/5"
          )}
        >
          {isExpanded ? (
            <div className="flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.4em]">
              {isSidebarLocked ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
              <span>{isSidebarLocked ? 'Unlock Workspace' : 'Lock Workspace'}</span>
            </div>
          ) : (
            <Pin className="w-3 h-3 mx-auto" />
          )}
        </Button>
      </div>
    </aside>
  );
}
