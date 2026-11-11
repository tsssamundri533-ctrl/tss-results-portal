
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  GraduationCap, 
  FileText, 
  CalendarCheck, 
  PenLine, 
  Trophy, 
  LayoutGrid, 
  Settings2, 
  CalendarRange, 
  School, 
  BookOpen, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Tickets,
  UserCheck,
  Zap,
  Pin,
  PinOff,
  MessageSquareQuote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/use-auth-store';
import { useSchoolStore } from '@/store/use-school-store';
import { useUIStore } from '@/store/use-ui-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_GROUPS = [
  {
    label: 'MAIN',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
    ]
  },
  {
    label: 'STUDENTS & STAFF',
    items: [
      { label: 'Students', href: '/admin/students', icon: Users },
      { label: 'Teachers', href: '/admin/teachers', icon: GraduationCap },
      { label: 'Teacher Duties', href: '/admin/assignments/worksheet', icon: UserCheck },
      { label: 'Exams', href: '/admin/exams', icon: FileText },
    ]
  },
  {
    label: 'EXAMS & MARKS',
    items: [
      { label: 'Attendance', href: '/admin/attendance', icon: CalendarCheck },
      { label: 'Marks Entry', href: '/admin/marks', icon: PenLine },
      { label: 'Results', href: '/admin/results', icon: Trophy },
      { label: 'Roll No Slips', href: '/admin/slips', icon: Tickets },
      { label: 'Seating Plan', href: '/admin/seating', icon: LayoutGrid },
    ]
  },
  {
    label: 'SETTINGS & SETUP',
    items: [
      { label: 'School Settings', href: '/admin/settings', icon: Settings2 },
      { label: 'Principal Remarks', href: '/admin/settings/remarks', icon: MessageSquareQuote },
      { label: 'Sessions & Terms', href: '/admin/settings/sessions', icon: CalendarRange },
      { label: 'Classes & Sections', href: '/admin/settings/classes', icon: School },
      { label: 'Subjects', href: '/admin/settings/subjects', icon: BookOpen },
    ]
  }
];

interface AdminSidebarProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

export function AdminSidebar({ isMobile: isMobileProp, onNavigate }: AdminSidebarProps) {
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

  const isExpanded = isMobileProp || isSidebarLocked || isHovered;
  const width = isMobileProp ? 'w-full' : (isExpanded ? 'w-[260px]' : 'w-[72px]');

  if (!mounted) return null;

  return (
    <aside 
      onMouseEnter={() => !isMobileProp && setIsHovered(true)}
      onMouseLeave={() => !isMobileProp && setIsHovered(false)}
      className={cn(
        "h-full bg-navy-900 dark:bg-navy-950 text-white transition-all duration-300 ease-in-out z-50 flex flex-col border-r border-white/5 shadow-2xl",
        isMobileProp ? "" : "fixed left-0 top-0 md:flex hidden",
        width
      )}
    >
      {/* Branding Header */}
      <div className="h-16 flex items-center px-4 border-b border-white/5 shrink-0 overflow-hidden">
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shrink-0 border border-white/20 shadow-lg shadow-primary-900/40">
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
                className="flex flex-col truncate min-w-0"
              >
                <span className="font-outfit font-black text-[13px] uppercase tracking-tighter truncate leading-tight">
                  {settings?.profile?.schoolName || 'The Spirit School'}
                </span>
                <Badge variant="outline" className="w-fit border-primary-500/30 bg-primary-500/10 text-primary-400 font-black text-[7px] uppercase px-1.5 h-3.5 mt-0.5 tracking-[0.2em]">ADMIN PORTAL</Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-8 px-3">
        <TooltipProvider delayDuration={0}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {isExpanded && (
                <h3 className="px-3 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-3">
                  {group.label}
                </h3>
              )}
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  
                  const content = (
                    <Link
                      href={item.href}
                      onClick={() => onNavigate?.()}
                      className={cn(
                        "flex items-center gap-3 px-3 h-11 rounded-xl transition-all group relative",
                        isActive 
                          ? "bg-primary-600 text-white shadow-lg shadow-primary-900/40" 
                          : "text-white/40 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive ? "text-white" : "text-white/30 group-hover:text-white/60")} />
                      {isExpanded && <span className="text-[13px] font-bold tracking-tight">{item.label}</span>}
                    </Link>
                  );

                  if (!isExpanded) {
                    return (
                      <Tooltip key={item.label}>
                        <TooltipTrigger asChild>{content}</TooltipTrigger>
                        <TooltipContent side="right" className="bg-navy-800 text-white border-white/10 font-bold uppercase text-[9px] tracking-widest px-3 py-1.5">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <React.Fragment key={item.label}>{content}</React.Fragment>;
                })}
              </nav>
            </div>
          ))}
        </TooltipProvider>
      </div>

      {/* User Terminal */}
      <div className="p-4 border-t border-white/5 bg-navy-950/50 space-y-4">
        <div className={cn("flex items-center gap-3", !isExpanded ? "justify-center" : "")}>
          <div className="relative shrink-0">
            <Avatar className="w-10 h-10 rounded-xl border-2 border-white/10 shadow-xl">
              <AvatarImage src={user?.photoURL || ''} className="object-cover" />
              <AvatarFallback className="bg-primary-700 text-white text-xs font-black">{user?.displayName?.[0] || 'A'}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-navy-900 shadow-sm animate-pulse"></div>
          </div>
          {isExpanded && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[13px] font-black truncate leading-tight text-white">{user?.displayName || 'Lead Admin'}</span>
              <span className="text-[9px] text-white/30 uppercase font-black tracking-widest mt-0.5">Verification: Master</span>
            </div>
          )}
          {isExpanded && (
            <Button variant="ghost" size="icon" onClick={logout} className="text-white/20 hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8 rounded-lg transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        
        {!isMobileProp && (
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
              <div className="flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.3em]">
                {isSidebarLocked ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                <span>{isSidebarLocked ? 'Unlock Sidebar' : 'Lock Sidebar'}</span>
              </div>
            ) : (
              <Pin className="w-3 h-3 mx-auto" />
            )}
          </Button>
        )}
      </div>
    </aside>
  );
}
