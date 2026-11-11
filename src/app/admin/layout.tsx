'use client';

import React, { useEffect } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopBar } from '@/components/layout/AdminTopBar';
import { useAuthStore } from '@/store/use-auth-store';
import { useSchoolStore } from '@/store/use-school-store';
import { useUIStore } from '@/store/use-ui-store';
import { useSchoolSettings } from '@/hooks/use-school-settings';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isSidebarLocked } = useUIStore();
  const pathname = usePathname();
  
  // Initialize school settings and real-time listeners
  useSchoolSettings();

  const isPrintPage = pathname?.includes('/admin/print/');

  if (isPrintPage) {
    return (
      <div className="min-h-screen bg-white text-black p-0 m-0 overflow-visible font-inter">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-surface-50 dark:bg-navy-950 overflow-x-hidden font-inter">
      <AdminSidebar />
      
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0",
        isSidebarLocked ? "md:pl-[260px]" : "md:pl-[72px]"
      )}>
        <AdminTopBar />
        <main className="flex-1 p-4 md:p-8 pb-32 md:pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key="admin-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
