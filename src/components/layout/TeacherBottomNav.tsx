
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PenLine, QrCode, CalendarCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const TABS = [
  { label: 'Home', href: '/teacher/dashboard', icon: Home },
  { label: 'Marks', href: '/teacher/marks', icon: PenLine },
  { label: 'Scan', href: '/teacher/scan', icon: QrCode, special: true },
  { label: 'Attendance', href: '/teacher/attendance', icon: CalendarCheck },
  { label: 'Profile', href: '/teacher/profile', icon: User },
];

export function TeacherBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-navy-900/95 border-t border-surface-200 dark:border-white/5 z-50 flex items-center justify-around px-2 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl md:hidden pb-[env(safe-area-inset-bottom)] select-none">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href || (tab.href !== '/teacher/dashboard' && pathname.startsWith(tab.href));
        
        if (tab.special) {
          return (
            <Link 
              key={tab.label}
              href={tab.href}
              className="relative -top-5"
            >
              <motion.div 
                whileTap={{ scale: 0.9, y: 5 }}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(79,70,229,0.4)] border-4 border-white dark:border-navy-950"
              >
                <tab.icon className="w-7 h-7" />
              </motion.div>
            </Link>
          );
        }

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-all flex-1 h-full relative",
              isActive ? "text-primary-600 dark:text-primary-400" : "text-slate-400 dark:text-slate-600"
            )}
          >
            {isActive && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute top-0 w-8 h-1 bg-primary-600 dark:bg-primary-400 rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <tab.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
            <span className="text-[9px] font-black uppercase tracking-tighter leading-none">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
