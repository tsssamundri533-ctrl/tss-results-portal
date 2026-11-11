'use client';

import React, { useState, useEffect } from 'react';
import { TeacherTopBar } from '@/components/layout/TeacherTopBar';
import { TeacherBottomNav } from '@/components/layout/TeacherBottomNav';
import { TeacherSidebar } from '@/components/layout/TeacherSidebar';
import { WelcomePopup } from '@/components/common/WelcomePopup';
import { useAuthStore } from '@/store/use-auth-store';
import { useSchoolStore } from '@/store/use-school-store';
import { useUIStore } from '@/store/use-ui-store';
import { useSchoolSettings } from '@/hooks/use-school-settings';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading, userName } = useAuthStore();
  const { settings, isLoading: settingsLoading } = useSchoolStore();
  const { isSidebarLocked } = useUIStore();
  const [showWelcome, setShowWelcome] = useState(false);
  
  useSchoolSettings();

  useEffect(() => {
    if (!authLoading && !settingsLoading && user && settings?.profile) {
      const hasSeenWelcome = sessionStorage.getItem(`welcome_seen_${user.uid}`);
      if (!hasSeenWelcome) {
        setShowWelcome(true);
        sessionStorage.setItem(`welcome_seen_${user.uid}`, 'true');
      }
    }
  }, [authLoading, settingsLoading, user, settings]);

  return (
    <div className="min-h-screen flex bg-surface-50 dark:bg-navy-950 overflow-x-hidden">
      <TeacherSidebar />
      
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 min-w-0",
        isSidebarLocked ? "md:pl-[260px]" : "md:pl-[72px]"
      )}>
        <TeacherTopBar />
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key="teacher-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <TeacherBottomNav />

      {showWelcome && (
        <WelcomePopup 
          userName={userName || user?.displayName || user?.email?.split('@')[0] || 'Teacher'} 
          schoolName={settings?.profile?.schoolName || 'TSSS'} 
          onClose={() => setShowWelcome(false)}
        />
      )}
    </div>
  );
}
